import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { components } from "./_generated/api";
import { authComponent, createAuth } from "./auth";
import { limits } from "./notebook";
import { requireOwner } from "./ownership";

const children = ["events", "changes", "payments", "punch"] as const;

async function deleteProject(ctx: MutationCtx, projectId: string) {
  for (const table of children) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_projectId_and_position", (q) =>
        q.eq("projectId", projectId),
      )
      .take(limits[table] + 1);
    for (const row of rows) await ctx.db.delete(row._id);
  }
  for (const row of await ctx.db
    .query("invites")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .take(100))
    await ctx.db.delete(row._id);
  for (const row of await ctx.db
    .query("members")
    .withIndex("by_projectId_and_userId", (q) => q.eq("projectId", projectId))
    .take(limits.members + 1))
    await ctx.db.delete(row._id);
  const project = await ctx.db
    .query("projects")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .unique();
  if (project) await ctx.db.delete(project._id);
}

/** Everything Reno stores for this user, outside Better Auth. */
export async function deleteAppData(ctx: MutationCtx, userId: string) {
  const memberships = await ctx.db
    .query("members")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(limits.projects + 1);
  for (const m of memberships) {
    if (m.role === "homeowner") await deleteProject(ctx, m.projectId);
    else await ctx.db.delete(m._id);
  }
  const files = await ctx.db
    .query("ownedFiles")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
    .take(1000);
  for (const file of files) {
    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(file._id);
  }
  for (const row of await ctx.db
    .query("pushTokens")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(100))
    await ctx.db.delete(row._id);
  const notebook = await ctx.db
    .query("notebooks")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
    .unique();
  if (notebook) await ctx.db.delete(notebook._id);
}

/**
 * Permanently deletes the signed-in account. Projects you started are deleted
 * for everyone on them; on projects you joined, you are removed and the
 * homeowner keeps their record. The client re-authenticates with a passkey
 * first, because Better Auth only deletes users with a fresh session.
 */
export const remove = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await deleteAppData(ctx, await requireOwner(ctx));

    const user = await authComponent.getAuthUser(ctx);
    // Better Auth's deleteUser removes the user, accounts and sessions, but
    // not plugin rows, so passkeys are removed here.
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
      input: {
        model: "passkey",
        where: [{ field: "userId", value: user._id }],
      },
      paginationOpts: { cursor: null, numItems: 100 },
    });
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    try {
      await auth.api.deleteUser({ headers, body: {} });
    } catch (error) {
      throw new ConvexError(
        error instanceof Error && /expired/i.test(error.message)
          ? "Confirm with Face ID again, then delete your account."
          : "Your account could not be deleted. Try again.",
      );
    }
    return null;
  },
});
