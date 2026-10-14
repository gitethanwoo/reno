import { AppState, emptyDraft, Quote } from "./model";
export const sampleQuotes: Quote[] = [
  {
    id: "coastal-v1",
    company: "Coastal Tile Co.",
    cents: 480000,
    depositPercent: 30,
    durationDays: 3,
    start: "2026-10-21",
    cleanup: true,
    items: [
      { label: "Labor", cents: 260000 },
      { label: "Tile & supplies", cents: 150000 },
      { label: "Prep & disposal", cents: 70000 },
    ],
  },
  {
    id: "palm-v1",
    company: "Palm Tile Studio",
    cents: 525000,
    depositPercent: 40,
    durationDays: 4,
    start: "2026-10-24",
    cleanup: false,
    items: [
      { label: "Labor", cents: 290000 },
      { label: "Tile & supplies", cents: 165000 },
      { label: "Preparation", cents: 70000 },
    ],
  },
];
export function initialState(): AppState {
  return {
    version: 1,
    name: "Maya",
    role: "homeowner",
    welcomed: false,
    savedGuides: [],
    draft: { ...emptyDraft, photos: [] },
    projects: [
      {
        id: "kitchen",
        title: "Kitchen backsplash",
        type: "Kitchen",
        scope:
          "Remove the existing backsplash and install 35 sq ft of sage ceramic tile. Keep the cabinets and counters. Prep and disposal included.",
        zip: "32084",
        timing: "Within a month",
        area: "35",
        photos: [],
        isSample: true,
        status: "active",
        quote: sampleQuotes[0],
        quotes: sampleQuotes,
        finish: "2026-10-23",
        changes: [
          {
            id: "trim",
            title: "Edge trim upgrade",
            reason:
              "Finish the exposed tile edge with brushed brass trim for a clean, durable edge.",
            cents: 24000,
            days: 1,
            status: "pending",
          },
        ],
        payments: [
          {
            id: "deposit",
            cents: 144000,
            date: "2026-10-20",
            method: "Bank transfer",
            note: "30% deposit",
          },
        ],
        punch: [
          {
            id: "window",
            title: "Finish the window edge",
            note: "The exposed tile edge needs the agreed finish.",
            status: "open",
          },
          {
            id: "grout",
            title: "Check grout by the outlet",
            note: "Please check the small gap beneath the outlet.",
            status: "review",
            resolution:
              "The gap has been filled and the surface cleaned. Ready for your review.",
          },
        ],
        events: [
          {
            id: "event-3",
            at: "2026-10-21T14:00:00Z",
            kind: "change",
            author: "Alex · Coastal Tile",
            text: "Proposed an edge trim upgrade: +$240 and 1 extra day. Waiting for your decision.",
          },
          {
            id: "event-2",
            at: "2026-10-21T12:30:00Z",
            kind: "update",
            author: "Alex · Coastal Tile",
            text: "Old tile is removed and the wall is prepped. We’re ready for the new backsplash.",
          },
          {
            id: "event-1",
            at: "2026-10-20T15:00:00Z",
            kind: "payment",
            author: "Maya",
            text: "Logged $1,440 paid by bank transfer. 30% deposit.",
          },
        ],
      },
    ],
  };
}
