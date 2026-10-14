import { defineApp } from "convex/server";
import { v } from "convex/values";
import betterAuth from "./betterAuth/convex.config";
const app = defineApp({
  env: {
    BETTER_AUTH_SECRET: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
    PASSKEY_RP_ID: v.optional(v.string()),
    APPLE_APP_ID: v.optional(v.string()),
  },
});
app.use(betterAuth);
export default app;
