import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import * as values from "./validators";

const child = {
  ownerId: v.string(),
  projectId: v.string(),
  position: v.number(),
};
export default defineSchema({
  notebooks: defineTable({ ownerId: v.string(), value: values.profile }).index(
    "by_ownerId",
    ["ownerId"],
  ),
  projects: defineTable({
    ownerId: v.string(),
    projectId: v.string(),
    position: v.number(),
    value: values.projectBase,
  })
    .index("by_ownerId_and_position", ["ownerId", "position"])
    .index("by_ownerId_and_projectId", ["ownerId", "projectId"]),
  events: defineTable({ ...child, value: values.event }).index(
    "by_ownerId_and_projectId_and_position",
    ["ownerId", "projectId", "position"],
  ),
  changes: defineTable({ ...child, value: values.change }).index(
    "by_ownerId_and_projectId_and_position",
    ["ownerId", "projectId", "position"],
  ),
  payments: defineTable({ ...child, value: values.payment }).index(
    "by_ownerId_and_projectId_and_position",
    ["ownerId", "projectId", "position"],
  ),
  punch: defineTable({ ...child, value: values.punch }).index(
    "by_ownerId_and_projectId_and_position",
    ["ownerId", "projectId", "position"],
  ),
  ownedFiles: defineTable({
    ownerId: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
  }).index("by_storageId", ["storageId"]),
});
