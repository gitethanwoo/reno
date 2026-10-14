import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  appStateSchema,
  type AppState,
  type Photo,
  type Project,
} from "../src/domain/model";
import { reduce, type Action } from "../src/domain/reducer";
import { initialState } from "../src/domain/seed";
import { requireOwner } from "./ownership";
import * as values from "./validators";

// Explicit first-release capacity: never truncate a financial or completion record.
export const limits = {
  projects: 20,
  events: 300,
  changes: 100,
  payments: 100,
  punch: 100,
  photos: 20,
  guides: 100,
} as const;
type Children = "events" | "changes" | "payments" | "punch";
const children = ["events", "changes", "payments", "punch"] as const;
function bounded<T>(rows: T[], max: number, label: string): T[] {
  if (rows.length > max)
    throw new ConvexError(
      `This notebook reached its first-release limit of ${max} ${label}. Nothing was removed. Contact support before adding more.`,
    );
  return rows;
}
function textBounds(value: unknown): void {
  if (typeof value === "string" && value.length > 8000)
    throw new ConvexError("Keep each text field under 8,000 characters.");
  if (Array.isArray(value)) {
    for (const item of value) textBounds(item);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) textBounds(item);
  }
}
function validateState(value: AppState): AppState {
  const state = appStateSchema.parse(value);
  textBounds(state);
  bounded(state.projects, limits.projects, "projects");
  bounded(state.savedGuides, limits.guides, "saved guides");
  bounded(state.draft.photos, limits.photos, "draft photos");
  for (const p of state.projects) {
    bounded(p.photos, limits.photos, "project photos");
    for (const kind of children)
      bounded<unknown>(p[kind], limits[kind], `${kind} per project`);
  }
  return state;
}
async function load(ctx: QueryCtx, ownerId: string): Promise<AppState | null> {
  const notebook = await ctx.db
    .query("notebooks")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .unique();
  if (!notebook) return null;
  const records = bounded(
    await ctx.db
      .query("projects")
      .withIndex("by_ownerId_and_position", (q) => q.eq("ownerId", ownerId))
      .take(limits.projects + 1),
    limits.projects,
    "projects",
  );
  const projects: Project[] = [];
  for (const row of records) {
    const p: Project = {
      ...row.value,
      events: [],
      changes: [],
      payments: [],
      punch: [],
    };
    const [events, changes, payments, punch] = await Promise.all([
      ctx.db
        .query("events")
        .withIndex("by_ownerId_and_projectId_and_position", (q) =>
          q.eq("ownerId", ownerId).eq("projectId", row.projectId),
        )
        .take(limits.events + 1),
      ctx.db
        .query("changes")
        .withIndex("by_ownerId_and_projectId_and_position", (q) =>
          q.eq("ownerId", ownerId).eq("projectId", row.projectId),
        )
        .take(limits.changes + 1),
      ctx.db
        .query("payments")
        .withIndex("by_ownerId_and_projectId_and_position", (q) =>
          q.eq("ownerId", ownerId).eq("projectId", row.projectId),
        )
        .take(limits.payments + 1),
      ctx.db
        .query("punch")
        .withIndex("by_ownerId_and_projectId_and_position", (q) =>
          q.eq("ownerId", ownerId).eq("projectId", row.projectId),
        )
        .take(limits.punch + 1),
    ]);
    p.events = bounded(
      events,
      limits.events,
      "timeline entries per project",
    ).map((r) => r.value);
    p.changes = bounded(changes, limits.changes, "changes per project").map(
      (r) => r.value,
    );
    p.payments = bounded(payments, limits.payments, "payments per project").map(
      (r) => r.value,
    );
    p.punch = bounded(punch, limits.punch, "punch items per project").map(
      (r) => r.value,
    );
    projects.push(p);
  }
  return { ...notebook.value, projects };
}
async function ownedPhoto(
  ctx: QueryCtx,
  ownerId: string,
  photo: Photo,
  withUrl: boolean,
): Promise<Photo> {
  const storageId = ctx.db.system.normalizeId("_storage", photo.id);
  if (!storageId)
    throw new ConvexError("Upload this photo before attaching it.");
  const file = await ctx.db
    .query("ownedFiles")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .unique();
  if (!file || file.ownerId !== ownerId)
    throw new ConvexError("This photo does not belong to your notebook.");
  return {
    id: storageId,
    name: file.name,
    uri: withUrl ? ((await ctx.storage.getUrl(storageId)) ?? "") : "",
  };
}
async function hydrate(
  ctx: QueryCtx,
  ownerId: string,
  state: AppState,
): Promise<AppState> {
  const cache = new Map<string, Promise<Photo>>();
  const photo = (p: Photo) => {
    let result = cache.get(p.id);
    if (!result) {
      result = ownedPhoto(ctx, ownerId, p, true);
      cache.set(p.id, result);
    }
    return result;
  };
  state.draft.photos = await Promise.all(state.draft.photos.map(photo));
  for (const p of state.projects) {
    p.photos = await Promise.all(p.photos.map(photo));
    for (const entry of [...p.events, ...p.punch])
      if (entry.photo) entry.photo = await photo(entry.photo);
  }
  return state;
}
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const differs = (a: unknown, b: unknown) =>
  JSON.stringify(a) !== JSON.stringify(b);
async function saveChildren(
  ctx: MutationCtx,
  ownerId: string,
  projectId: string,
  table: Children,
  next: Project[Children],
) {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_ownerId_and_projectId_and_position", (q) =>
      q.eq("ownerId", ownerId).eq("projectId", projectId),
    )
    .take(limits[table] + 1);
  bounded(rows, limits[table], `${table} per project`);
  const byId = new Map(rows.map((row) => [row.value.id, row]));
  const nextIds = new Set(next.map((item) => item.id));
  for (const row of rows)
    if (!nextIds.has(row.value.id)) await ctx.db.delete(row._id);
  for (let position = 0; position < next.length; position++) {
    const value = clean(next[position]);
    const previous = byId.get(value.id);
    // Each table's validator enforces the concrete child shape on write.
    const document = { ownerId, projectId, position, value } as {
      [K in Children]: Omit<Doc<K>, "_id" | "_creationTime">;
    }[Children];
    if (!previous) await ctx.db.insert(table, document);
    else if (previous.position !== position || differs(previous.value, value))
      await ctx.db.replace(previous._id, document);
  }
}
async function save(
  ctx: MutationCtx,
  ownerId: string,
  state: AppState,
  before: AppState | null,
) {
  const { projects, ...profile } = clean(state);
  const notebook = await ctx.db
    .query("notebooks")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .unique();
  if (!notebook) await ctx.db.insert("notebooks", { ownerId, value: profile });
  else if (differs(notebook.value, profile))
    await ctx.db.patch(notebook._id, { value: profile });
  for (let position = 0; position < projects.length; position++) {
    const p = projects[position];
    const prior = before?.projects.find((row) => row.id === p.id);
    const {
      events: _events,
      changes: _changes,
      payments: _payments,
      punch: _punch,
      ...value
    } = p;
    const stored = await ctx.db
      .query("projects")
      .withIndex("by_ownerId_and_projectId", (q) =>
        q.eq("ownerId", ownerId).eq("projectId", p.id),
      )
      .unique();
    if (!stored)
      await ctx.db.insert("projects", {
        ownerId,
        projectId: p.id,
        position,
        value,
      });
    else if (stored.position !== position || differs(stored.value, value))
      await ctx.db.patch(stored._id, { position, value });
    for (const table of children)
      if (!prior || differs(prior[table], p[table]))
        await saveChildren(ctx, ownerId, p.id, table, p[table]);
  }
}
export const get = query({
  args: {},
  returns: v.union(values.appState, v.null()),
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx);
    const state = await load(ctx, ownerId);
    return state ? await hydrate(ctx, ownerId, state) : null;
  },
});
export const initialize = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx);
    if (
      await ctx.db
        .query("notebooks")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
        .unique()
    )
      return null;
    await save(ctx, ownerId, validateState(initialState()), null);
    return null;
  },
});
export const commit = mutation({
  args: { action: values.action },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const before = await load(ctx, ownerId);
    if (!before)
      throw new ConvexError("Your notebook is still getting ready. Try again.");
    let action: Action = args.action;
    textBounds(action);
    if ("at" in action)
      action = { ...action, at: new Date(Date.now()).toISOString() };
    if (action.type === "save-draft")
      action = {
        ...action,
        draft: {
          ...action.draft,
          photos: await Promise.all(
            action.draft.photos.map((photo) =>
              ownedPhoto(ctx, ownerId, photo, false),
            ),
          ),
        },
      };
    if ("photo" in action && action.photo)
      action = {
        ...action,
        photo: await ownedPhoto(ctx, ownerId, action.photo, false),
      };
    try {
      const next = validateState(reduce(before, action));
      await save(ctx, ownerId, next, before);
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      throw new ConvexError(
        error instanceof Error ? error.message : "Unable to save this change.",
      );
    }
    return null;
  },
});
