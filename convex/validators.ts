import { v } from "convex/values";

export const role = v.union(v.literal("homeowner"), v.literal("contractor"));
export const photo = v.object({
  id: v.string(),
  uri: v.string(),
  name: v.string(),
});
export const draft = v.object({
  title: v.string(),
  type: v.string(),
  scope: v.string(),
  zip: v.string(),
  timing: v.string(),
  area: v.string(),
  photos: v.array(photo),
});
export const event = v.object({
  id: v.string(),
  at: v.string(),
  kind: v.union(
    v.literal("update"),
    v.literal("change"),
    v.literal("payment"),
    v.literal("punch"),
    v.literal("project"),
  ),
  author: v.string(),
  text: v.string(),
  photo: v.optional(photo),
});
export const change = v.object({
  id: v.string(),
  title: v.string(),
  reason: v.string(),
  cents: v.number(),
  days: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("declined"),
  ),
  decidedAt: v.optional(v.string()),
});
export const payment = v.object({
  id: v.string(),
  cents: v.number(),
  date: v.string(),
  method: v.string(),
  note: v.string(),
});
export const punch = v.object({
  id: v.string(),
  title: v.string(),
  note: v.string(),
  status: v.union(
    v.literal("open"),
    v.literal("review"),
    v.literal("resolved"),
  ),
  photo: v.optional(photo),
  resolution: v.optional(v.string()),
});
export const quote = v.object({
  id: v.string(),
  company: v.string(),
  cents: v.number(),
  depositPercent: v.number(),
  durationDays: v.number(),
  start: v.string(),
  cleanup: v.boolean(),
  items: v.array(v.object({ label: v.string(), cents: v.number() })),
});
export const projectBase = v.object({
  id: v.string(),
  title: v.string(),
  type: v.string(),
  scope: v.string(),
  zip: v.string(),
  timing: v.string(),
  area: v.string(),
  photos: v.array(photo),
  isSample: v.boolean(),
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("completed"),
  ),
  quote: v.union(quote, v.null()),
  quotes: v.array(quote),
  finish: v.union(v.string(), v.null()),
  completedAt: v.optional(v.string()),
});
export const member = v.object({ name: v.string(), role });
export const invite = v.object({ code: v.string(), expiresAt: v.string() });
export const project = projectBase.extend({
  events: v.array(event),
  changes: v.array(change),
  payments: v.array(payment),
  punch: v.array(punch),
  viewerRole: v.optional(role),
  members: v.optional(v.array(member)),
  invite: v.optional(v.union(invite, v.null())),
});
export const profile = v.object({
  version: v.literal(1),
  name: v.string(),
  role,
  welcomed: v.boolean(),
  savedGuides: v.array(v.string()),
  draft,
});
export const appState = profile.extend({ projects: v.array(project) });
export const action = v.union(
  v.object({ type: v.literal("welcome") }),
  v.object({ type: v.literal("profile"), name: v.string(), role }),
  v.object({ type: v.literal("save-draft"), draft }),
  v.object({
    type: v.literal("create-project"),
    id: v.string(),
    at: v.string(),
  }),
  v.object({ type: v.literal("save-guide"), id: v.string() }),
  v.object({
    type: v.literal("change-decision"),
    projectId: v.string(),
    id: v.string(),
    decision: v.union(v.literal("approved"), v.literal("declined")),
    at: v.string(),
  }),
  v.object({
    type: v.literal("propose-change"),
    projectId: v.string(),
    id: v.string(),
    title: v.string(),
    reason: v.string(),
    cents: v.number(),
    days: v.number(),
    at: v.string(),
  }),
  v.object({
    type: v.literal("payment"),
    projectId: v.string(),
    id: v.string(),
    cents: v.number(),
    date: v.string(),
    method: v.string(),
    note: v.string(),
    at: v.string(),
  }),
  v.object({
    type: v.literal("update"),
    projectId: v.string(),
    id: v.string(),
    text: v.string(),
    photo: v.optional(photo),
    at: v.string(),
  }),
  v.object({
    type: v.literal("punch-add"),
    projectId: v.string(),
    id: v.string(),
    title: v.string(),
    note: v.string(),
    photo: v.optional(photo),
    at: v.string(),
  }),
  v.object({
    type: v.literal("punch-review"),
    projectId: v.string(),
    id: v.string(),
    status: v.union(
      v.literal("review"),
      v.literal("resolved"),
      v.literal("open"),
    ),
    note: v.string(),
    at: v.string(),
  }),
  v.object({
    type: v.literal("complete"),
    projectId: v.string(),
    at: v.string(),
  }),
  v.object({
    type: v.literal("send-quote"),
    projectId: v.string(),
    id: v.string(),
    company: v.string(),
    depositPercent: v.number(),
    durationDays: v.number(),
    start: v.string(),
    cleanup: v.boolean(),
    items: v.array(v.object({ label: v.string(), cents: v.number() })),
    at: v.string(),
  }),
  v.object({
    type: v.literal("accept-quote"),
    projectId: v.string(),
    quoteId: v.string(),
    at: v.string(),
  }),
);
