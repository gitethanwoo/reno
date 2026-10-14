import {
  AppState,
  Draft,
  Photo,
  Project,
  Role,
  Quote,
  addDays,
  emptyDraft,
  money,
  projectPhotoLimit,
  quoteTotal,
  remaining,
  roleIn,
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
  | { type: "complete"; projectId: string; at: string }
  | { type: "add-photos"; projectId: string; photos: Photo[]; at: string }
  | {
      type: "send-quote";
      projectId: string;
      id: string;
      company: string;
      depositPercent: number;
      durationDays: number;
      start: string;
      cleanup: boolean;
      items: Quote["items"];
      at: string;
    }
  | { type: "accept-quote"; projectId: string; quoteId: string; at: string };
const days = (n: number) => n + (n === 1 ? " day" : " days");
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
  const role = roleIn(p, state);
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
    author:
      p.isSample && role === "contractor" ? "Alex · Coastal Tile" : state.name,
  });
  if (action.type === "complete") {
    requireRole(role, "homeowner");
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
              : action.type === "add-photos"
                ? action.photos.length > 0 &&
                  action.photos.every((n) =>
                    p.photos.some((i) => i.id === n.id),
                  )
                : false;
    if (duplicate) return state;
    if (p.status === "completed")
      throw new Error(
        "This project is complete. Its saved record is read-only.",
      );
    if (action.type === "change-decision") {
      requireRole(role, "homeowner");
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
                ? "+" + money(change.cents) + " · +" + days(change.days) + "."
                : "The agreed price and schedule are unchanged."),
            "decision-" + action.id,
          ),
          ...p.events,
        ],
      };
    } else if (action.type === "propose-change") {
      requireRole(role, "contractor");
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
              days(action.days) +
              ". Awaiting approval.",
            action.id,
          ),
          ...p.events,
        ],
      };
    } else if (action.type === "payment") {
      requireRole(role, "homeowner");
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
    } else if (action.type === "add-photos") {
      // Either side can document the site.
      const photos = action.photos.filter(
        (n, i, all) =>
          all.findIndex((o) => o.id === n.id) === i &&
          !p.photos.some((o) => o.id === n.id),
      );
      if (!photos.length) throw new Error("Choose at least one photo.");
      if (p.photos.length + photos.length > projectPhotoLimit)
        throw new Error(
          "A project holds up to " +
            projectPhotoLimit +
            " photos. " +
            (p.photos.length < projectPhotoLimit
              ? "Choose " + (projectPhotoLimit - p.photos.length) + " or fewer."
              : "This one is full."),
        );
      next = {
        ...p,
        photos: [...p.photos, ...photos],
        events: [
          {
            ...event(
              "update",
              photos.length === 1
                ? "Added a photo."
                : "Added " + photos.length + " photos.",
              "photos-" + photos[0].id,
            ),
            photo: photos[0],
          },
          ...p.events,
        ],
      };
    } else if (action.type === "punch-add") {
      requireRole(role, "homeowner");
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
    } else if (action.type === "send-quote") {
      requireRole(role, "contractor");
      if (p.status !== "planning")
        throw new Error("A quote has already been accepted for this project.");
      if (p.quotes.some((q) => q.id === action.id)) return state;
      const items = action.items
        .map((i) => ({ label: i.label.trim(), cents: i.cents }))
        .filter((i) => i.label || i.cents);
      if (!action.company.trim()) throw new Error("Add your business name.");
      if (!items.length || items.length > 20)
        throw new Error("Add between 1 and 20 line items.");
      if (
        items.some(
          (i) =>
            !i.label ||
            !Number.isInteger(i.cents) ||
            i.cents <= 0 ||
            i.cents > 100_000_000,
        )
      )
        throw new Error("Give every line item a name and an amount.");
      if (quoteTotal(items) > 100_000_000)
        throw new Error("Keep the quote total under $1,000,000.");
      if (
        !Number.isInteger(action.depositPercent) ||
        action.depositPercent < 0 ||
        action.depositPercent > 100
      )
        throw new Error("Enter a deposit between 0 and 100 percent.");
      if (
        !Number.isInteger(action.durationDays) ||
        action.durationDays < 1 ||
        action.durationDays > 365
      )
        throw new Error("Enter how many working days the job takes.");
      if (!validDate(action.start))
        throw new Error("Enter a valid start date as YYYY-MM-DD.");
      const revision = p.quotes.length > 0;
      const quote: Quote = {
        id: action.id,
        company: action.company.trim(),
        cents: quoteTotal(items),
        depositPercent: action.depositPercent,
        durationDays: action.durationDays,
        start: action.start,
        cleanup: action.cleanup,
        items,
      };
      // Earlier versions stay in the record; the newest is last.
      next = {
        ...p,
        quotes: [...p.quotes, quote],
        events: [
          event(
            "project",
            (revision ? "Sent a revised quote: " : "Sent a quote: ") +
              money(quote.cents) +
              ", " +
              days(quote.durationDays) +
              " starting " +
              quote.start +
              ".",
            action.id,
          ),
          ...p.events,
        ],
      };
    } else if (action.type === "accept-quote") {
      requireRole(role, "homeowner");
      if (p.status !== "planning")
        throw new Error("A quote has already been accepted for this project.");
      const quote = p.quotes.find((q) => q.id === action.quoteId);
      if (!quote) throw new Error("This quote could not be found.");
      if (quote.id !== p.quotes[p.quotes.length - 1].id)
        throw new Error("A newer version of this quote was sent. Review it first.");
      next = {
        ...p,
        status: "active",
        quote,
        finish: addDays(quote.start, quote.durationDays - 1),
        events: [
          event(
            "project",
            "Accepted the quote from " +
              quote.company +
              " for " +
              money(quote.cents) +
              ".",
            "accept-" + quote.id,
          ),
          ...p.events,
        ],
      };
    } else if (action.type === "punch-review") {
      const item = p.punch.find((i) => i.id === action.id);
      if (!item) throw new Error("This item could not be found.");
      if (item.status === action.status) return state;
      if (action.status === "review") {
        requireRole(role, "contractor");
        if (item.status !== "open" || !action.note.trim())
          throw new Error("Explain the fix before sending it for review.");
      } else {
        requireRole(role, "homeowner");
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
