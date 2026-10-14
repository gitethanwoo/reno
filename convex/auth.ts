import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { anonymous } from "better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { env } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  { local: { schema: authSchema } },
);
type AuthSettings = {
  siteUrl?: string;
  convexUrl?: string;
  rpId?: string;
  secret?: string;
};
// Schema generation and the component adapter call this without reading runtime env.
export function createAuthOptions(
  ctx: GenericCtx<DataModel>,
  settings: AuthSettings = {},
) {
  const siteUrl = settings.siteUrl ?? "http://localhost:8081";
  const convexUrl =
    settings.convexUrl ?? "https://insightful-viper-971.convex.site";
  return {
    appName: "Reno",
    baseURL: convexUrl,
    secret: settings.secret,
    trustedOrigins: [siteUrl, convexUrl, "reno://"],
    database: authComponent.adapter(ctx),
    plugins: [
      anonymous(),
      passkey({
        rpID: settings.rpId ?? "insightful-viper-971.convex.site",
        rpName: "Reno",
        origin: [siteUrl, convexUrl],
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
        },
      }),
      expo(),
      convex({ authConfig }),
      crossDomain({ siteUrl }),
    ],
  } satisfies BetterAuthOptions;
}
export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(
    createAuthOptions(ctx, {
      siteUrl: env.SITE_URL,
      convexUrl: env.CONVEX_SITE_URL,
      rpId: env.PASSKEY_RP_ID,
      secret: env.BETTER_AUTH_SECRET,
    }),
  );
}
