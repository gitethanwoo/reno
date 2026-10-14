import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  appStateSchema,
  type AppState,
  type Member,
  type Photo,
  type Project,
  projectPhotoLimit,
  type Role,
} from "../src/domain/model";
import { reduce, type Action } from "../src/domain/reducer";
import { initialState } from "../src/domain/seed";
import { requireOwner } from "./ownership";
import { commitNotice } from "./notify";
import { schedulePush } from "./push";
import * as values from "./validators";

// Explicit first-release capacity: never truncate a financial or completion record.
export const limits = {
  projects: 20,
  members: 2,
  events: 300,
  changes: 100,
  payments: 100,
  punch: 100,
  photos: projectPhotoLimit,
  guides: 100,
} as const;
type Children = "events" | "changes" | "payments" | "punch";
const children = ["events", "changes", "payments", "punch"] as const;
export function bounded<T>(rows: T[], max: number, label: string): T[] {
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
    bounded(p.quotes, limits.changes, "quotes per project");
    for (const kind of children)
      bounded<unknown>(p[kind], limits[kind], `${kind} per project`);
  }
  return state;
}
export async function membership(
  ctx: QueryCtx,
  projectId: string,
  userId: string,
) {
  return await ctx.db
    .query("members")
    .withIndex("by_projectId_and_userId", (q) =>
      q.eq("projectId", projectId).eq("userId", userId),
    )
    .unique();
}
export async function projectMembers(ctx: QueryCtx, projectId: string) {
  return bounded(
    await ctx.db
      .query("members")
      .withIndex("by_projectId_and_userId", (q) => q.eq("projectId", projectId))
      .take(limits.members + 1),
    limits.members,
    "people per project",
  );
}
export async function displayName(ctx: QueryCtx, userId: string) {
  const notebook = await ctx.db
    .query("notebooks")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
    .unique();
  return notebook?.value.name || "Reno member";
}
const childRows = (
  ctx: QueryCtx,
  table: Children,
  projectId: string,
): Promise<Doc<Children>[]> => {
  const take = limits[table] + 1;
  const index = "by_projectId_and_position" as const;
  switch (table) {
    case "events":
      return ctx.db
        .query("events")
        .withIndex(index, (q) => q.eq("projectId", projectId))
        .take(take);
    case "changes":
      return ctx.db
        .query("changes")
        .withIndex(index, (q) => q.eq("projectId", projectId))
        .take(take);
    case "payments":
      return ctx.db
        .query("payments")
        .withIndex(index, (q) => q.eq("projectId", projectId))
        .take(take);
    case "punch":
      return ctx.db
        .query("punch")
        .withIndex(index, (q) => q.eq("projectId", projectId))
        .take(take);
  }
};
async function loadChildren<K extends Children>(
  ctx: QueryCtx,
  table: K,
  projectId: string,
): Promise<Project[K]> {
  const rows = await childRows(ctx, table, projectId);
  return bounded(rows, limits[table], `${table} per project`).map(
    (r) => r.value,
  ) as Project[K];
}
/** One project as the given role sees it. */
export async function loadProject(
  ctx: QueryCtx,
  projectId: string,
  role: Role,
): Promise<Project | null> {
  const row = await ctx.db
    .query("projects")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .unique();
  if (!row) return null;
  const [events, changes, payments, punch, people] = await Promise.all([
    loadChildren(ctx, "events", projectId),
    loadChildren(ctx, "changes", projectId),
    loadChildren(ctx, "payments", projectId),
    loadChildren(ctx, "punch", projectId),
    projectMembers(ctx, projectId),
  ]);
  const members: Member[] = await Promise.all(
    people.map(async (m) => ({
      name: await displayName(ctx, m.userId),
      role: m.role,
    })),
  );
  members.sort((a, b) =>
    a.role === b.role ? 0 : a.role === "homeowner" ? -1 : 1,
  );
  let invite: Project["invite"] = null;
  if (role === "homeowner" && !row.value.isSample) {
    const open = await ctx.db
      .query("invites")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first();
    if (open && !open.acceptedBy)
      invite = {
        token: open.token,
        expiresAt: new Date(open.expiresAt).toISOString(),
      };
  }
  return {
    ...row.value,
    events,
    changes,
    payments,
    punch,
    viewerRole: role,
    members,
    invite,
  };
}
async function load(ctx: QueryCtx, userId: string): Promise<AppState | null> {
  const notebook = await ctx.db
    .query("notebooks")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
    .unique();
  if (!notebook) return null;
  // Newest membership first, matching the order projects were added.
  const memberships = bounded(
    await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limits.projects + 1),
    limits.projects,
    "projects",
  );
  const projects: Project[] = [];
  for (const m of memberships) {
    const p = await loadProject(ctx, m.projectId, m.role);
    if (p) projects.push(p);
  }
  return { ...notebook.value, projects };
}
async function ownedPhoto(
  ctx: QueryCtx,
  ownerId: string,
  photo: Photo,
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
  return { id: storageId, name: file.name, uri: "" };
}
// Ownership is checked when a photo is attached; anyone who can see the
// project can see its photos.
async function hydrate(ctx: QueryCtx, state: AppState): Promise<AppState> {
  const cache = new Map<string, Promise<Photo>>();
  const photo = (p: Photo) => {
    let result = cache.get(p.id);
    if (!result) {
      const storageId = ctx.db.system.normalizeId("_storage", p.id);
      result = (
        storageId ? ctx.storage.getUrl(storageId) : Promise.resolve(null)
      ).then((uri) => ({ ...p, uri: uri ?? "" }));
      cache.set(p.id, result);
    }
    return result;
  };
  state.draft.photos = await Promise.all(state.draft.photos.map(photo));
  for (const p of state.projects) {
    p.photos = await Promise.all(p.photos.map(photo));
    for (const entry of [...p.events, ...p.punch])
      if (entry.photo) entry.photo = await photo(entry.photo);
    for (const item of p.punch)
      if (item.fixPhoto) item.fixPhoto = await photo(item.fixPhoto);
  }
  return state;
}
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const differs = (a: unknown, b: unknown) =>
  JSON.stringify(a) !== JSON.stringify(b);
export async function saveChildren(
  ctx: MutationCtx,
  projectId: string,
  table: Children,
  next: Project[Children],
) {
  const rows = await childRows(ctx, table, projectId);
  bounded(rows, limits[table], `${table} per project`);
  const byId = new Map(rows.map((row) => [row.value.id, row]));
  const nextIds = new Set(next.map((item) => item.id));
  for (const row of rows)
    if (!nextIds.has(row.value.id)) await ctx.db.delete(row._id);
  for (let position = 0; position < next.length; position++) {
    const value = clean(next[position]);
    const previous = byId.get(value.id);
    // Each table's validator enforces the concrete child shape on write.
    const document = { projectId, position, value } as {
      [K in Children]: Omit<Doc<K>, "_id" | "_creationTime">;
    }[Children];
    if (!previous) await ctx.db.insert(table, document);
    else if (previous.position !== position || differs(previous.value, value))
      await ctx.db.replace(previous._id, document);
  }
}
/** Stored project fields only; viewer-specific fields are derived on read. */
function stored(p: Project): Doc<"projects">["value"] {
  const {
    events: _events,
    changes: _changes,
    payments: _payments,
    punch: _punch,
    viewerRole: _viewerRole,
    members: _members,
    invite: _invite,
    ...value
  } = clean(p);
  return value;
}
async function save(
  ctx: MutationCtx,
  userId: string,
  state: AppState,
  before: AppState | null,
) {
  const { projects, ...profile } = clean(state);
  const notebook = await ctx.db
    .query("notebooks")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
    .unique();
  if (!notebook)
    await ctx.db.insert("notebooks", { ownerId: userId, value: profile });
  else if (differs(notebook.value, profile))
    await ctx.db.patch(notebook._id, { value: profile });
  for (const p of projects) {
    const prior = before?.projects.find((row) => row.id === p.id);
    if (!prior) {
      // A new project: its ID must not belong to anyone else's project.
      const taken = await ctx.db
        .query("projects")
        .withIndex("by_projectId", (q) => q.eq("projectId", p.id))
        .unique();
      if (taken)
        throw new ConvexError("That project ID is already in use. Try again.");
      await ctx.db.insert("projects", {
        createdBy: userId,
        projectId: p.id,
        value: stored(p),
      });
      await ctx.db.insert("members", {
        projectId: p.id,
        userId,
        role: "homeowner",
      });
    } else if (differs(stored(prior), stored(p))) {
      const row = await ctx.db
        .query("projects")
        .withIndex("by_projectId", (q) => q.eq("projectId", p.id))
        .unique();
      if (!row) throw new ConvexError("This project could not be found.");
      await ctx.db.patch(row._id, { value: stored(p) });
    }
    for (const table of children)
      if (!prior || differs(prior[table], p[table]))
        await saveChildren(ctx, p.id, table, p[table]);
  }
}
const randomId = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};
export const get = query({
  args: {},
  returns: v.union(values.appState, v.null()),
  handler: async (ctx) => {
    const userId = await requireOwner(ctx);
    const state = await load(ctx, userId);
    return state ? await hydrate(ctx, state) : null;
  },
});
export const initialize = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireOwner(ctx);
    if (
      await ctx.db
        .query("notebooks")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
        .unique()
    )
      return null;
    // Project IDs are global, so each notebook gets its own sample ID.
    const seed = initialState();
    // The app asks for a first name right after sign-up; the sample keeps Maya.
    seed.name = "";
    seed.projects = seed.projects.map((p) => ({
      ...p,
      id: `${p.id}-${randomId()}`,
    }));
    await save(ctx, userId, validateState(seed), null);
    return null;
  },
});
export const commit = mutation({
  args: { action: values.action },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const before = await load(ctx, userId);
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
            action.draft.photos.map((photo) => ownedPhoto(ctx, userId, photo)),
          ),
        },
      };
    if (action.type === "add-photos")
      action = {
        ...action,
        photos: await Promise.all(
          bounded(action.photos, limits.photos, "project photos").map((photo) =>
            ownedPhoto(ctx, userId, photo),
          ),
        ),
      };
    if ("photo" in action && action.photo)
      action = {
        ...action,
        photo: await ownedPhoto(ctx, userId, action.photo),
      };
    try {
      const next = validateState(reduce(before, action));
      await save(ctx, userId, next, before);
      if ("projectId" in action)
        await schedulePush(
          ctx,
          action.projectId,
          userId,
          commitNotice(before, next, action),
        );
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      throw new ConvexError(
        error instanceof Error ? error.message : "Unable to save this change.",
      );
    }
    return null;
  },
});
