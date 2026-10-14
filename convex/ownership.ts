import { ConvexError } from "convex/values";
import type { ActionCtx, QueryCtx } from "./_generated/server";

export async function requireOwner(ctx: Pick<QueryCtx | ActionCtx, "auth">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Sign in to open your Reno notebook.");
  return identity.tokenIdentifier;
}
