import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { env, httpAction } from "./_generated/server";
const http = httpRouter();
authComponent.registerRoutes(http, createAuth, { cors: true });
http.route({
  path: "/.well-known/apple-app-site-association",
  method: "GET",
  handler: httpAction(
    async () =>
      new Response(
        JSON.stringify({
          webcredentials: { apps: env.APPLE_APP_ID ? [env.APPLE_APP_ID] : [] },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
          },
        },
      ),
  ),
});
export default http;
