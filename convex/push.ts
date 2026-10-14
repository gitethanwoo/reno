import { ConvexError, v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOwner } from "./ownership";
import type { Notice } from "./notify";

// https://docs.expo.dev/push-notifications/sending-notifications/
const SEND_URL = "https://exp.host/--/api/v2/push/send";
const RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const BATCH = 100;
const DEVICES_PER_USER = 10;
// Expo asks senders to check receipts about 15 minutes after sending.
const RECEIPT_DELAY = 15 * 60 * 1000;
const tokenPattern = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export const register = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const userId = await requireOwner(ctx);
    if (!tokenPattern.test(token))
      throw new ConvexError("That isn't an Expo push token.");
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing) {
      // The same device signed in as someone else: it now belongs to them.
      if (existing.userId !== userId)
        await ctx.db.patch(existing._id, { userId });
      return null;
    }
    await ctx.db.insert("pushTokens", { userId, token });
    // Keep the newest devices; old phones stop hearing about the project.
    const mine = await ctx.db
      .query("pushTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(DEVICES_PER_USER + 5);
    for (const row of mine.slice(DEVICES_PER_USER))
      await ctx.db.delete(row._id);
    return null;
  },
});

export const unregister = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const userId = await requireOwner(ctx);
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing?.userId === userId) await ctx.db.delete(existing._id);
    return null;
  },
});

/**
 * Schedules a push to the project members in the notice's role, never the
 * actor. Call after the action has been saved.
 */
export async function schedulePush(
  ctx: MutationCtx,
  projectId: string,
  actorId: string,
  notice: Notice | null,
) {
  if (!notice) return;
  const members = await ctx.db
    .query("members")
    .withIndex("by_projectId_and_userId", (q) => q.eq("projectId", projectId))
    .take(10);
  const userIds = members
    .filter((m) => m.role === notice.to && m.userId !== actorId)
    .map((m) => m.userId);
  if (!userIds.length) return;
  await ctx.scheduler.runAfter(0, internal.push.send, {
    userIds,
    title: notice.title,
    body: notice.body,
    url: notice.url,
  });
}

export const tokensFor = internalQuery({
  args: { userIds: v.array(v.string()) },
  returns: v.array(v.string()),
  handler: async (ctx, { userIds }) => {
    const tokens: string[] = [];
    for (const userId of userIds) {
      const rows = await ctx.db
        .query("pushTokens")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .take(DEVICES_PER_USER);
      tokens.push(...rows.map((r) => r.token));
    }
    return tokens;
  },
});

export const removeTokens = internalMutation({
  args: { tokens: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { tokens }) => {
    for (const token of tokens) {
      const row = await ctx.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
      if (row) await ctx.db.delete(row._id);
    }
    return null;
  },
});

// Expo push service responses, as documented under "Push tickets" and
// "Push receipts". Both are parsed from unknown JSON.
type Outcome =
  | { status: "ok"; id?: string }
  | { status: "error"; message?: string; error?: string };
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
function outcome(value: unknown): Outcome | null {
  if (!isRecord(value)) return null;
  if (value.status === "ok")
    return {
      status: "ok",
      id: typeof value.id === "string" ? value.id : undefined,
    };
  if (value.status === "error") {
    const details = isRecord(value.details) ? value.details : {};
    return {
      status: "error",
      message: typeof value.message === "string" ? value.message : undefined,
      error: typeof details.error === "string" ? details.error : undefined,
    };
  }
  return null;
}
async function post(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "accept-encoding": "gzip, deflate",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      `Expo push ${url} failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  return json;
}

export const send = internalAction({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    url: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tokens: string[] = await ctx.runQuery(internal.push.tokensFor, {
      userIds: args.userIds,
    });
    if (!tokens.length) return null;
    const dead: string[] = [];
    const pending: { id: string; token: string }[] = [];
    for (let start = 0; start < tokens.length; start += BATCH) {
      const batch = tokens.slice(start, start + BATCH);
      // One message per token so each ticket maps back to its token.
      const messages = batch.map((to) => ({
        to,
        title: args.title,
        body: args.body,
        sound: "default",
        data: { url: args.url },
      }));
      const json = await post(SEND_URL, messages);
      console.log("Expo push tickets", JSON.stringify(json));
      const tickets =
        isRecord(json) && Array.isArray(json.data) ? json.data : [];
      tickets.forEach((raw, i) => {
        const ticket = outcome(raw);
        const token = batch[i];
        if (!ticket || !token) return;
        if (ticket.status === "ok" && ticket.id)
          pending.push({ id: ticket.id, token });
        else if (ticket.status === "error") {
          if (ticket.error === "DeviceNotRegistered") dead.push(token);
          else console.warn("Expo push ticket error", JSON.stringify(raw));
        }
      });
    }
    if (dead.length)
      await ctx.runMutation(internal.push.removeTokens, { tokens: dead });
    if (pending.length)
      await ctx.scheduler.runAfter(RECEIPT_DELAY, internal.push.receipts, {
        tickets: pending,
      });
    return null;
  },
});

export const receipts = internalAction({
  args: { tickets: v.array(v.object({ id: v.string(), token: v.string() })) },
  returns: v.null(),
  handler: async (ctx, { tickets }) => {
    const dead: string[] = [];
    for (let start = 0; start < tickets.length; start += 1000) {
      const batch = tickets.slice(start, start + 1000);
      const json = await post(RECEIPTS_URL, { ids: batch.map((t) => t.id) });
      console.log("Expo push receipts", JSON.stringify(json));
      const data = isRecord(json) && isRecord(json.data) ? json.data : {};
      for (const { id, token } of batch) {
        const receipt = outcome(data[id]);
        if (receipt?.status !== "error") continue;
        if (receipt.error === "DeviceNotRegistered") dead.push(token);
        else console.warn("Expo push receipt error", JSON.stringify(data[id]));
      }
    }
    if (dead.length)
      await ctx.runMutation(internal.push.removeTokens, { tokens: dead });
    return null;
  },
});
