import {
  AppState,
  Draft,
  Photo,
  Project,
  Role,
  addDays,
  emptyDraft,
  money,
  remaining,
  validDate,
  validateDraft,
} from "./model";
export type Action =
  | { type: "welcome" }
  | { type: "profile"; name: string; role: Role }
  | { type: "save-draft"; draft: Draft }
  | { type: "create-project"; id: string; at: string }
  | { type: "save-guide"; id: string }
  | {
      type: "change-decision";
      projectId: string;
      id: string;
      decision: "approved" | "declined";
      at: string;
    }
  | {
      type: "propose-change";
      projectId: string;
      id: string;
      title: string;
      reason: string;
      cents: number;
      days: number;
      at: string;
    }
  | {
      type: "payment";
      projectId: string;
      id: string;
      cents: number;
      date: string;
      method: string;
      note: string;
      at: string;
    }
  | {
      type: "update";
      projectId: string;
      id: string;
      text: string;
      photo?: Photo;
      at: string;
    }
  | {
      type: "punch-add";
      projectId: string;
      id: string;
      title: string;
      note: string;
      photo?: Photo;
      at: string;
    }
  | {
      type: "punch-review";
      projectId: string;
      id: string;
      status: "review" | "resolved" | "open";
      note: string;
      at: string;
    }
  | { type: "complete"; projectId: string; at: string };
function requireRole(role: Role, expected: Role) {
  if (role !== expected)
    throw new Error("Switch to the " + expected + " workspace to do this.");
}
export function reduce(state: AppState, action: Action): AppState {
  if (action.type === "welcome") return { ...state, welcomed: true };
  if (action.type === "profile") {
    if (!action.name.trim()) throw new Error("Enter your name.");
    return { ...state, name: action.name.trim(), role: action.role };
  }
  if (action.type === "save-draft") return { ...state, draft: action.draft };
  if (action.type === "save-guide")
    return {
      ...state,
      savedGuides: state.savedGuides.includes(action.id)
        ? state.savedGuides.filter((id) => id !== action.id)
        : [...state.savedGuides, action.id],
    };
  if (action.type === "create-project") {
    requireRole(state.role, "homeowner");
    if (state.projects.some((p) => p.id === action.id)) return state;
    validateDraft(state.draft);
    const project: Project = {
      ...state.draft,
      title: state.draft.title.trim(),
      scope: state.draft.scope.trim(),
      id: action.id,
      isSample: false,
      status: "planning",
      quote: null,
      quotes: [],
      finish: null,
      payments: [],
      changes: [],
      punch: [],
      events: [
        {
          id: action.id,
          at: action.at,
          kind: "project",
          author: state.name,
          text: "Created this project. Scope and photos saved in the notebook.",
        },
      ],
    };
    return {
      ...state,
      projects: [project, ...state.projects],
      draft: { ...emptyDraft, photos: [] },
    };
  }
  const index = state.projects.findIndex((p) => p.id === action.projectId);
  if (index < 0) throw new Error("This project could not be found.");
  const p = state.projects[index];
  const projects = [...state.projects];
  let next = p;
  const event = (
    kind: Project["events"][number]["kind"],
    text: string,
    id: string,
  ) => ({
    id,
    at: action.at,
    kind,
    text,
    author: state.role === "contractor" ? "Alex · Coastal Tile" : state.name,
  });
  if (action.type === "complete") {
    requireRole(state.role, "homeowner");
    if (p.status === "completed") return state;
    if (p.status !== "active")
      throw new Error("Choose a contractor before completing a project.");
    if (p.changes.some((c) => c.status === "pending"))
      throw new Error("Decide on pending changes first.");
    if (p.punch.some((item) => item.status !== "resolved"))
      throw new Error("Review and resolve every punch-list item first.");
    if (remaining(p) !== 0)
      throw new Error(
        "Reconcile the payment record before completing this project.",
      );
    next = {
      ...p,
      status: "completed",
      completedAt: action.at,
      events: [
        event(
          "project",
          "Reviewed the work and completed the project.",
          "complete-" + p.id,
        ),
        ...p.events,
      ],
    };
  } else {
    // Completion is immutable; duplicate requests remain harmless.
    const duplicate =
      action.type === "payment"
        ? p.payments.some((i) => i.id === action.id)
        : action.type === "propose-change"
          ? p.changes.some((i) => i.id === action.id)
          : action.type === "punch-add"
            ? p.punch.some((i) => i.id === action.id)
            : action.type === "update"
              ? p.events.some((i) => i.id === action.id)
              : false;
    if (duplicate) return state;
    if (p.status === "completed")
      throw new Error(
        "This project is complete. Its saved record is read-only.",
      );
    if (action.type === "change-decision") {
      requireRole(state.role, "homeowner");
      const change = p.changes.find((c) => c.id === action.id);
      if (!change) throw new Error("This change could not be found.");
      if (change.status === action.decision) return state;
      if (change.status !== "pending")
        throw new Error(
          "A decision has already been recorded for this change.",
        );
      next = {
        ...p,
        changes: p.changes.map((c) =>
          c.id === action.id
            ? { ...c, status: action.decision, decidedAt: action.at }
            : c,
        ),
        finish:
          action.decision === "approved" && p.finish
            ? addDays(p.finish, change.days)
            : p.finish,
        events: [
          event(
            "change",
            (action.decision === "approved" ? "Approved" : "Declined") +
              " “" +
              change.title +
              "”. " +
              (action.decision === "approved"
                ? "+" + money(change.cents) + " · +" + change.days + " day(s)."
                : "The agreed price and schedule are unchanged."),
            "decision-" + action.id,
          ),
          ...p.events,
        ],
      };
    } else if (action.type === "propose-change") {
      requireRole(state.role, "contractor");
      if (p.status !== "active")
        throw new Error("Changes are available for active projects.");
      if (!action.title.trim() || !action.reason.trim())
        throw new Error("Add a title and reason.");
      if (
        !Number.isInteger(action.cents) ||
        action.cents < 0 ||
        action.cents > 100_000_000 ||
        !Number.isInteger(action.days) ||
        action.days < 0 ||
        action.days > 365
      )
        throw new Error("Enter a valid cost and number of days.");
      next = {
        ...p,
        changes: [
          ...p.changes,
          {
            id: action.id,
            title: action.title.trim(),
            reason: action.reason.trim(),
            cents: action.cents,
            days: action.days,
            status: "pending",
          },
        ],
        events: [
          event(
            "change",
            "Proposed “" +
              action.title.trim() +
              "”: +" +
              money(action.cents) +
              " · +" +
              action.days +
              " day(s). Awaiting approval.",
            action.id,
          ),
          ...p.events,
        ],
      };
    } else if (action.type === "payment") {
      requireRole(state.role, "homeowner");
      if (p.status !== "active")
        throw new Error("Payments need an accepted quote first.");
      if (
        !Number.isInteger(action.cents) ||
        action.cents <= 0 ||
        action.cents > remaining(p)
      )
        throw new Error(
          "Enter an amount greater than zero and no more than the remaining balance.",
        );
      if (!validDate(action.date))
        throw new Error("Enter a valid date as YYYY-MM-DD.");
      if (!action.method.trim()) throw new Error("Choose how you paid.");
      next = {
        ...p,
        payments: [
          ...p.payments,
          {
            id: action.id,
            cents: action.cents,
            date: action.date,
            method: action.method,
            note: action.note.trim(),
          },
        ],
        events: [
          event(
            "payment",
            "Logged " +
              money(action.cents) +
              " paid by " +
              action.method.toLowerCase() +
              (action.note.trim() ? ". " + action.note.trim() : "."),
            action.id,
          ),
          ...p.events,
        ],
      };
    } else if (action.type === "update") {
      if (!action.text.trim() && !action.photo)
        throw new Error("Write an update or add a photo.");
      next = {
        ...p,
        events: [
          {
            ...event("update", action.text.trim(), action.id),
            photo: action.photo,
          },
          ...p.events,
        ],
      };
    } else if (action.type === "punch-add") {
      requireRole(state.role, "homeowner");
      if (!action.title.trim())
        throw new Error("Name the item that needs attention.");
      next = {
        ...p,
        punch: [
          ...p.punch,
          {
            id: action.id,
            title: action.title.trim(),
            note: action.note.trim(),
            status: "open",
            photo: action.photo,
          },
        ],
        events: [
          event("punch", "Added punch item: " + action.title.trim(), action.id),
          ...p.events,
        ],
      };
    } else if (action.type === "punch-review") {
      const item = p.punch.find((i) => i.id === action.id);
      if (!item) throw new Error("This item could not be found.");
      if (item.status === action.status) return state;
      if (action.status === "review") {
        requireRole(state.role, "contractor");
        if (item.status !== "open" || !action.note.trim())
          throw new Error("Explain the fix before sending it for review.");
      } else {
        requireRole(state.role, "homeowner");
        if (action.status === "resolved" && item.status !== "review")
          throw new Error(
            "The contractor needs to submit the fix before you accept it.",
          );
        if (action.status === "open" && !action.note.trim())
          throw new Error("Explain what still needs attention.");
      }
      next = {
        ...p,
        punch: p.punch.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: action.status,
                resolution: action.note.trim() || i.resolution,
              }
            : i,
        ),
        events: [
          event(
            "punch",
            (action.status === "review"
              ? "Submitted a fix for "
              : action.status === "resolved"
                ? "Accepted the fix for "
                : "Reopened ") +
              item.title +
              (action.note.trim() ? ". " + action.note.trim() : "."),
            "punch-" + item.id + "-" + action.at,
          ),
          ...p.events,
        ],
      };
    }
  }
  projects[index] = next;
  return { ...state, projects };
}
