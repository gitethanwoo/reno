import { ConvexError, v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOwner } from "./ownership";
import { photo } from "./validators";
import type { Photo } from "../src/domain/model";

const MAX_BYTES = 5 * 1024 * 1024;
function verifyImage(data: ArrayBuffer, type: string) {
  if (!data.byteLength || data.byteLength > MAX_BYTES)
    throw new ConvexError("Choose an image smaller than 5 MB.");
  const bytes = new Uint8Array(data);
  const prefix = (values: number[]) =>
    values.every((value, i) => bytes[i] === value);
  const valid =
    type === "image/jpeg"
      ? prefix([0xff, 0xd8, 0xff])
      : type === "image/png"
        ? prefix([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        : type === "image/webp"
          ? prefix([0x52, 0x49, 0x46, 0x46]) &&
            bytes[8] === 0x57 &&
            bytes[9] === 0x45 &&
            bytes[10] === 0x42 &&
            bytes[11] === 0x50
          : false;
  if (!valid) throw new ConvexError("Choose a JPEG, PNG, or WebP image.");
}
export const record = internalMutation({
  args: { ownerId: v.string(), storageId: v.id("_storage"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata || metadata.size > MAX_BYTES)
      throw new ConvexError("Unable to save this photo.");
    await ctx.db.insert("ownedFiles", args);
    return null;
  },
});
export const upload = action({
  args: { data: v.bytes(), contentType: v.string(), name: v.string() },
  returns: photo,
  handler: async (ctx, args): Promise<Photo> => {
    const ownerId = await requireOwner(ctx);
    verifyImage(args.data, args.contentType);
    const name = args.name.trim().slice(0, 160) || "Project photo";
    const storageId = await ctx.storage.store(
      new Blob([args.data], { type: args.contentType }),
    );
    try {
      await ctx.runMutation(internal.files.record, {
        ownerId,
        storageId,
        name,
      });
      const uri = await ctx.storage.getUrl(storageId);
      if (!uri) throw new ConvexError("Unable to retrieve the uploaded photo.");
      return { id: storageId, uri, name };
    } catch (error) {
      await ctx.storage.delete(storageId);
      throw error;
    }
  },
});
