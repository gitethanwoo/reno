/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  const as = (subject: string) =>
    t.withIdentity({ subject, issuer: "https://reno.test" });
  return { t, alice: as("alice"), bob: as("bob") };
}
type T = ReturnType<typeof setup>["t"];
type User = ReturnType<typeof setup>["alice"];

const draft = {
  title: "Primary bath tile",
  type: "Bathroom",
  scope: "Replace shower tile and regrout the floor.",
  zip: "32084",
  timing: "Next month",
  area: "60 sq ft",
  photos: [],
};
const quote = (projectId: string, id: string) => ({
  type: "send-quote" as const,
  projectId,
  id,
  company: "Coastal Tile",
  depositPercent: 25,
  durationDays: 5,
  start: "2026-11-02",
  cleanup: true,
  items: [{ label: "Tile labor", cents: 400000 }],
  at: "",
});

async function profile(user: User, name: string) {
  await user.mutation(api.notebook.initialize, {});
  await user.mutation(api.notebook.commit, {
    action: { type: "profile", name, role: "homeowner" },
  });
}
/** Alice owns bath-1 and Bob has joined it as the contractor. */
async function shared() {
  const s = setup();
  await profile(s.alice, "Alice");
  await profile(s.bob, "Bob");
  await s.alice.mutation(api.notebook.commit, {
    action: { type: "save-draft", draft },
  });
  await s.alice.mutation(api.notebook.commit, {
    action: { type: "create-project", id: "bath-1", at: "" },
  });
  const { token } = await s.alice.mutation(api.invites.create, {
    projectId: "bath-1",
  });
  await s.bob.mutation(api.invites.accept, { token });
  const ids = await s.t.run(async (ctx) => {
    const rows = await ctx.db.query("members").collect();
    const id = (role: string) => rows.find((r) => r.role === role)!.userId;
    return { alice: id("homeowner"), bob: id("contractor") };
  });
  return { ...s, ids };
}
/** Push sends scheduled so far, oldest first. */
async function scheduled(t: T) {
  const rows = await t.run((ctx) =>
    ctx.db.system.query("_scheduled_functions").collect(),
  );
  return rows
    .filter((r) => r.name.includes("push") && r.name.includes("send"))
    .map((r) => r.args[0]);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("push notifications", () => {
  test("each action notifies the other member, never the actor", async () => {
    const { t, alice, bob, ids } = await shared();
    const projectId = "bath-1";
    expect(await scheduled(t)).toEqual([
      {
        userIds: [ids.alice],
        title: "Primary bath tile",
        body: "Bob joined as your contractor.",
        url: "/project/bath-1",
      },
    ]);

    await bob.mutation(api.notebook.commit, { action: quote(projectId, "q1") });
    // A retried send changes nothing, so nobody is notified twice.
    await bob.mutation(api.notebook.commit, { action: quote(projectId, "q1") });
    await alice.mutation(api.notebook.commit, {
      action: { type: "accept-quote", projectId, quoteId: "q1", at: "" },
    });
    await bob.mutation(api.notebook.commit, {
      action: {
        type: "propose-change",
        projectId,
        id: "niche",
        title: "Add a niche",
        reason: "Wall is open",
        cents: 40000,
        days: 1,
        at: "",
      },
    });
    await alice.mutation(api.notebook.commit, {
      action: {
        type: "change-decision",
        projectId,
        id: "niche",
        decision: "declined",
        at: "",
      },
    });
    await alice.mutation(api.notebook.commit, {
      action: {
        type: "punch-add",
        projectId,
        id: "grout",
        title: "Grout haze",
        note: "",
        at: "",
      },
    });
    await bob.mutation(api.notebook.commit, {
      action: {
        type: "punch-review",
        projectId,
        id: "grout",
        status: "review",
        note: "Cleaned it",
        at: "",
      },
    });
    await alice.mutation(api.notebook.commit, {
      action: {
        type: "payment",
        projectId,
        id: "p1",
        cents: 100000,
        date: "2026-11-03",
        method: "Check",
        note: "",
        at: "",
      },
    });
    await bob.mutation(api.notebook.commit, {
      action: {
        type: "update",
        projectId,
        id: "u1",
        text: "Tile is up.",
        at: "",
      },
    });
    // Profile edits are private.
    await alice.mutation(api.notebook.commit, {
      action: { type: "profile", name: "Alice", role: "contractor" },
    });

    const sends = (await scheduled(t)).slice(1);
    expect(sends.map((s) => [s.userIds, s.body, s.url])).toEqual([
      [
        [ids.alice],
        "Coastal Tile sent a quote: $4,000.",
        "/project/bath-1/quotes",
      ],
      [[ids.bob], "Alice accepted your quote for $4,000.", "/project/bath-1"],
      [
        [ids.alice],
        "Bob proposed “Add a niche”: +$400, +1 day.",
        "/project/bath-1/change?changeId=niche",
      ],
      [
        [ids.bob],
        "Alice declined “Add a niche”.",
        "/project/bath-1/change?changeId=niche",
      ],
      [
        [ids.bob],
        "Alice added a punch-list item: Grout haze.",
        "/project/bath-1/punch?itemId=grout",
      ],
      [
        [ids.alice],
        "Bob submitted a fix for Grout haze.",
        "/project/bath-1/punch?itemId=grout",
      ],
      [
        [ids.bob],
        "Alice logged a $1,000 payment.",
        "/project/bath-1?tab=money",
      ],
      [[ids.alice], "Bob: Tile is up.", "/project/bath-1?tab=record"],
    ]);
  });

  test("sample projects and solo projects never notify", async () => {
    const { t, alice } = setup();
    await alice.mutation(api.notebook.initialize, {});
    const projectId = (await alice.query(api.notebook.get, {}))!.projects[0].id;
    await alice.mutation(api.notebook.commit, {
      action: { type: "update", projectId, id: "u1", text: "Hello", at: "" },
    });
    await alice.mutation(api.notebook.commit, {
      action: { type: "profile", name: "Alice", role: "contractor" },
    });
    await alice.mutation(api.notebook.commit, {
      action: {
        type: "punch-review",
        projectId,
        id: "window",
        status: "review",
        note: "Recaulked",
        at: "",
      },
    });
    expect(await scheduled(t)).toEqual([]);
  });

  test("register moves a device to its newest user; unregister removes only your own", async () => {
    const { t, alice, bob, ids } = await shared();
    const token = "ExponentPushToken[device-1]";
    await expect(
      alice.mutation(api.push.register, { token: "nope" }),
    ).rejects.toThrow("Expo push token");
    await alice.mutation(api.push.register, { token });
    await alice.mutation(api.push.register, { token });
    await alice.mutation(api.push.register, {
      token: "ExpoPushToken[device-2]",
    });
    await bob.mutation(api.push.register, { token });
    const owners = () =>
      t.run(async (ctx) =>
        (await ctx.db.query("pushTokens").collect()).map((r) => [
          r.token,
          r.userId,
        ]),
      );
    expect(await owners()).toEqual([
      [token, ids.bob],
      ["ExpoPushToken[device-2]", ids.alice],
    ]);
    await alice.mutation(api.push.unregister, { token });
    expect(await owners()).toHaveLength(2);
    await bob.mutation(api.push.unregister, { token });
    expect(await owners()).toEqual([["ExpoPushToken[device-2]", ids.alice]]);
  });

  test("send batches to every device and drops unregistered ones", async () => {
    const { t, alice, ids } = await shared();
    // Let the join notice run first; no devices are registered yet.
    vi.useFakeTimers();
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    const good = "ExponentPushToken[good]";
    const gone = "ExponentPushToken[gone]";
    const later = "ExponentPushToken[later]";
    for (const token of [good, gone, later])
      await alice.mutation(api.push.register, { token });
    const requests: { url: string; body: unknown }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const body: unknown = JSON.parse(String(init.body));
      requests.push({ url, body });
      // Shapes from https://docs.expo.dev/push-notifications/sending-notifications/
      const json = url.endsWith("/send")
        ? {
            data: [
              { status: "ok", id: "ticket-good" },
              {
                status: "error",
                message: `"${gone}" is not a registered push notification recipient`,
                details: { error: "DeviceNotRegistered" },
              },
              { status: "ok", id: "ticket-later" },
            ],
          }
        : {
            data: {
              "ticket-good": { status: "ok" },
              "ticket-later": {
                status: "error",
                message: "The device cannot receive push notifications anymore",
                details: { error: "DeviceNotRegistered" },
              },
            },
          };
      return new Response(JSON.stringify(json), { status: 200 });
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    await t.action(internal.push.send, {
      userIds: [ids.alice],
      title: "Primary bath tile",
      body: "Bob joined as your contractor.",
      url: "/project/bath-1",
    });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());

    expect(requests).toEqual([
      {
        url: "https://exp.host/--/api/v2/push/send",
        body: [good, gone, later].map((to) => ({
          to,
          title: "Primary bath tile",
          body: "Bob joined as your contractor.",
          sound: "default",
          data: { url: "/project/bath-1" },
        })),
      },
      {
        url: "https://exp.host/--/api/v2/push/getReceipts",
        body: { ids: ["ticket-good", "ticket-later"] },
      },
    ]);
    const left = await t.run(async (ctx) =>
      (await ctx.db.query("pushTokens").collect()).map((r) => r.token),
    );
    expect(left).toEqual([good]);
  });
});
