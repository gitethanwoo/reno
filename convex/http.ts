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
          // Invite links open straight into the app when it's installed.
          applinks: {
            details: env.APPLE_APP_ID
              ? [
                  {
                    appIDs: [env.APPLE_APP_ID],
                    components: [{ "/": "/join/*" }],
                  },
                ]
              : [],
          },
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
// Reached only when the app isn't installed (or on a computer).
http.route({
  pathPrefix: "/join/",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const token = new URL(request.url).pathname.slice("/join/".length);
    if (!/^[0-9a-f]{32}$/.test(token))
      return new Response("Not found", { status: 404 });
    return new Response(
      `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Join a project on Reno</title>
<style>
  body { margin: 0; background: #F8F5EF; color: #17332F; font: 17px/1.5 -apple-system, system-ui, sans-serif; }
  h1 { font-family: Georgia, serif; font-weight: 400; }
  main { max-width: 420px; margin: 0 auto; padding: 64px 24px; }
  h1 { font-size: 30px; line-height: 1.15; margin: 0 0 12px; }
  a.button { display: block; margin-top: 28px; padding: 15px; border-radius: 12px; background: #17332F; color: #F8F5EF; text-align: center; text-decoration: none; font-weight: 600; }
  p.note { color: #68746C; font-size: 15px; }
</style>
</head>
<body><main>
<h1>You've been invited to a project on Reno.</h1>
<p>Open this link on your iPhone with Reno installed to see the project and join it as the contractor.</p>
<a class="button" href="reno://join/${token}">Open in Reno</a>
<p class="note">This link works once and expires 48 hours after it was sent.</p>
</main></body>
</html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  }),
});
export default http;
