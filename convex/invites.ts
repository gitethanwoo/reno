import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Project } from "../src/domain/model";
import {
  displayName,
  limits,
  loadProject,
  membership,
  projectMembers,
  saveChildren,
} from "./notebook";
import { requireOwner } from "./ownership";

const week = 7 * 24 * 60 * 60 * 1000;
// No 0/O, 1/I/L: codes are read aloud and typed by hand.
const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function newCode() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
}
/** Accepts lowercase, spaces, and a missing dash. */
function normalize(code: string) {
  const raw = code.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return raw.length === 10 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
}
async function requireHomeowner(
  ctx: QueryCtx,
  projectId: string,
  userId: string,
) {
  const member = await membership(ctx, projectId, userId);
  if (member?.role !== "homeowner")
    throw new ConvexError("Only the homeowner can invite someone.");
}
async function openInvites(ctx: QueryCtx, projectId: string) {
  const rows = await ctx.db
    .query("invites")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .take(100);
  return rows.filter((row) => !row.acceptedBy);
}

export const create = mutation({
  args: { projectId: v.string() },
  returns: v.object({ code: v.string(), expiresAt: v.string() }),
  handler: async (ctx, { projectId }) => {
    const userId = await requireOwner(ctx);
    await requireHomeowner(ctx, projectId, userId);
    const project = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .unique();
    if (!project || project.value.isSample)
      throw new ConvexError("Sample projects can't be shared.");
    const people = await projectMembers(ctx, projectId);
    if (people.some((m) => m.role === "contractor"))
      throw new ConvexError("This project already has a contractor.");
    // One live code per project: a new code replaces the old one.
    for (const row of await openInvites(ctx, projectId))
      await ctx.db.delete(row._id);
    let code = newCode();
    while (
      await ctx.db
        .query("invites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique()
    )
      code = newCode();
    const expiresAt = Date.now() + week;
    await ctx.db.insert("invites", {
      code,
      projectId,
      createdBy: userId,
      expiresAt,
    });
    return { code, expiresAt: new Date(expiresAt).toISOString() };
  },
});

export const revoke = mutation({
  args: { projectId: v.string() },
  returns: v.null(),
  handler: async (ctx, { projectId }) => {
    const userId = await requireOwner(ctx);
    await requireHomeowner(ctx, projectId, userId);
    for (const row of await openInvites(ctx, projectId))
      await ctx.db.delete(row._id);
    return null;
  },
});

const problem = (
  status: "invalid" | "used" | "expired" | "member" | "full",
  message: string,
) => ({ status, message });

export const preview = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      status: v.literal("ok"),
      title: v.string(),
      type: v.string(),
      zip: v.string(),
      homeowner: v.string(),
      expiresAt: v.string(),
    }),
    v.object({
      status: v.union(
        v.literal("invalid"),
        v.literal("used"),
        v.literal("expired"),
        v.literal("member"),
        v.literal("full"),
      ),
      message: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", normalize(args.code)))
      .unique();
    if (!invite)
      return problem(
        "invalid",
        "That code doesn't match an invite. Check it with the homeowner.",
      );
    if (invite.acceptedBy)
      return problem(
        "used",
        invite.acceptedBy === userId
          ? "You've already joined this project."
          : "This code has already been used. Ask the homeowner for a new one.",
      );
    if (await membership(ctx, invite.projectId, userId))
      return problem("member", "You're already on this project.");
    const people = await projectMembers(ctx, invite.projectId);
    if (people.some((m) => m.role === "contractor"))
      return problem("full", "This project already has a contractor.");
    const project = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("projectId", invite.projectId))
      .unique();
    if (!project) return problem("invalid", "That project no longer exists.");
    // Queries can't read the clock; the client compares expiresAt and
    // accept enforces it.
    return {
      status: "ok" as const,
      title: project.value.title,
      type: project.value.type,
      zip: project.value.zip,
      homeowner: await displayName(ctx, invite.createdBy),
      expiresAt: new Date(invite.expiresAt).toISOString(),
    };
  },
});

export const accept = mutation({
  args: { code: v.string() },
  returns: v.object({ projectId: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const notebook = await ctx.db
      .query("notebooks")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
      .unique();
    if (!notebook)
      throw new ConvexError("Your notebook is still getting ready. Try again.");
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", normalize(args.code)))
      .unique();
    if (!invite) throw new ConvexError("That code doesn't match an invite.");
    if (invite.acceptedBy)
      throw new ConvexError("This code has already been used.");
    const now = Date.now();
    if (invite.expiresAt < now)
      throw new ConvexError(
        "This code has expired. Ask the homeowner for a new one.",
      );
    if (await membership(ctx, invite.projectId, userId))
      throw new ConvexError("You're already on this project.");
    const people = await projectMembers(ctx, invite.projectId);
    if (people.some((m) => m.role === "contractor"))
      throw new ConvexError("This project already has a contractor.");
    const mine = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(limits.projects + 1);
    if (mine.length >= limits.projects)
      throw new ConvexError(
        `You've reached the first-release limit of ${limits.projects} projects.`,
      );
    const project: Project | null = await loadProject(
      ctx,
      invite.projectId,
      "contractor",
    );
    if (!project) throw new ConvexError("That project no longer exists.");
    if (project.events.length >= limits.events)
      throw new ConvexError(
        `This project reached its first-release limit of ${limits.events} events.`,
      );
    await ctx.db.patch(invite._id, { acceptedBy: userId });
    await ctx.db.insert("members", {
      projectId: invite.projectId,
      userId,
      role: "contractor",
    });
    const joined = {
      id: `joined-${invite._id}`,
      at: new Date(now).toISOString(),
      kind: "project" as const,
      author: notebook.value.name,
      text: `${notebook.value.name} joined the project as the contractor.`,
    };
    await saveChildren(ctx, invite.projectId, "events", [
      joined,
      ...project.events,
    ]);
    return { projectId: invite.projectId };
  },
});
