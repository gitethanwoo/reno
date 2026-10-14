// Pure: decides who hears about an action and what the push says. No Convex
// APIs here, so it can be unit tested and reused by commit and invites.
import { money, roleIn, type AppState, type Role } from "../src/domain/model";
import type { Action } from "../src/domain/reducer";

export type Notice = {
  /** The role on the project that should hear about this. */
  to: Role;
  title: string;
  body: string;
  /** An Expo Router path inside the app. */
  url: string;
};

const clip = (text: string, max = 120) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1).trimEnd() + "…" : flat;
};
/** JSON with sorted keys, so parsed and unparsed copies compare equal. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : item,
  );
}
const days = (n: number) => n + (n === 1 ? " day" : " days");
const path = (projectId: string, rest = "", query?: Record<string, string>) =>
  "/project/" +
  encodeURIComponent(projectId) +
  rest +
  (query ? "?" + new URLSearchParams(query).toString() : "");

export function joinedNotice(
  project: { id: string; title: string; isSample: boolean },
  name: string,
): Notice | null {
  if (project.isSample) return null;
  return {
    to: "homeowner",
    title: project.title,
    body: name + " joined as your contractor.",
    url: path(project.id),
  };
}

/**
 * The notice for one committed action, or null when nobody else needs to
 * know: profile and draft edits, sample projects, and retries that changed
 * nothing.
 */
export function commitNotice(
  before: AppState,
  after: AppState,
  action: Action,
): Notice | null {
  if (!("projectId" in action)) return null;
  const was = before.projects.find((p) => p.id === action.projectId);
  const p = after.projects.find((row) => row.id === action.projectId);
  if (!was || !p || p.isSample) return null;
  if (stable(was) === stable(p)) return null;
  const actor = roleIn(p, after);
  const other: Role = actor === "homeowner" ? "contractor" : "homeowner";
  const name = after.name.trim() || "Your " + actor;
  const notice = (body: string, url: string): Notice => ({
    to: other,
    title: p.title,
    body: clip(body, 160),
    url,
  });
  const id = p.id;
  switch (action.type) {
    case "send-quote": {
      const quote = p.quotes.find((q) => q.id === action.id);
      if (!quote) return null;
      const revised = p.quotes.length > 1;
      return notice(
        quote.company +
          (revised ? " sent a revised quote: " : " sent a quote: ") +
          money(quote.cents) +
          ".",
        path(id, "/quotes"),
      );
    }
    case "accept-quote":
      return p.quote
        ? notice(
            name + " accepted your quote for " + money(p.quote.cents) + ".",
            path(id),
          )
        : null;
    case "propose-change":
      return notice(
        name +
          " proposed “" +
          clip(action.title, 60) +
          "”: +" +
          money(action.cents) +
          ", +" +
          days(action.days) +
          ".",
        path(id, "/change", { changeId: action.id }),
      );
    case "change-decision": {
      const change = p.changes.find((c) => c.id === action.id);
      if (!change) return null;
      return notice(
        name +
          (action.decision === "approved" ? " approved “" : " declined “") +
          clip(change.title, 60) +
          "”.",
        path(id, "/change", { changeId: action.id }),
      );
    }
    case "punch-add":
      return notice(
        name + " added a punch-list item: " + clip(action.title, 60) + ".",
        path(id, "/punch", { itemId: action.id }),
      );
    case "punch-review": {
      const item = p.punch.find((i) => i.id === action.id);
      if (!item) return null;
      const verb =
        action.status === "review"
          ? " submitted a fix for "
          : action.status === "resolved"
            ? " accepted your fix for "
            : " reopened ";
      return notice(
        name + verb + clip(item.title, 60) + ".",
        path(id, "/punch", { itemId: item.id }),
      );
    }
    case "payment":
      return notice(
        name + " logged a " + money(action.cents) + " payment.",
        path(id, "", { tab: "money" }),
      );
    case "update":
      return notice(
        action.text.trim()
          ? name + ": " + clip(action.text)
          : name + " posted a photo.",
        path(id, "", { tab: "record" }),
      );
    case "complete":
      return notice(name + " marked the project complete.", path(id));
  }
}
