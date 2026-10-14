import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import * as values from "./validators";

// Project records are shared by everyone on the project, so they are keyed by
// the globally unique projectId. Access is decided by the members table.
const child = { projectId: v.string(), position: v.number() };
export default defineSchema({
  notebooks: defineTable({ ownerId: v.string(), value: values.profile }).index(
    "by_ownerId",
    ["ownerId"],
  ),
  projects: defineTable({
    createdBy: v.string(),
    projectId: v.string(),
    value: values.projectBase,
  }).index("by_projectId", ["projectId"]),
  members: defineTable({
    projectId: v.string(),
    userId: v.string(),
    role: values.role,
  })
    .index("by_userId", ["userId"])
    .index("by_projectId_and_userId", ["projectId", "userId"]),
  invites: defineTable({
    token: v.string(),
    projectId: v.string(),
    createdBy: v.string(),
    expiresAt: v.number(),
    acceptedBy: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_projectId", ["projectId"]),
  events: defineTable({ ...child, value: values.event }).index(
    "by_projectId_and_position",
    ["projectId", "position"],
  ),
  changes: defineTable({ ...child, value: values.change }).index(
    "by_projectId_and_position",
    ["projectId", "position"],
  ),
  payments: defineTable({ ...child, value: values.payment }).index(
    "by_projectId_and_position",
    ["projectId", "position"],
  ),
  punch: defineTable({ ...child, value: values.punch }).index(
    "by_projectId_and_position",
    ["projectId", "position"],
  ),
  // Expo push tokens. One user can have several devices; a token belongs to
  // whoever registered it last on that device.
  pushTokens: defineTable({ userId: v.string(), token: v.string() })
    .index("by_userId", ["userId"])
    .index("by_token", ["token"]),
  ownedFiles: defineTable({
    ownerId: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
  }).index("by_storageId", ["storageId"]),
});
