import { z } from "zod";

const cents = z.number().int().nonnegative().max(100_000_000);
export const roleSchema = z.enum(["homeowner", "contractor"]);
export type Role = z.infer<typeof roleSchema>;
export const photoSchema = z.object({
  id: z.string(),
  uri: z.string(),
  name: z.string(),
});
export type Photo = z.infer<typeof photoSchema>;
export const draftSchema = z.object({
  title: z.string(),
  type: z.string(),
  scope: z.string(),
  zip: z.string(),
  timing: z.string(),
  area: z.string(),
  photos: z.array(photoSchema),
});
export type Draft = z.infer<typeof draftSchema>;
const eventSchema = z.object({
  id: z.string(),
  at: z.string(),
  kind: z.enum(["update", "change", "payment", "punch", "project"]),
  author: z.string(),
  text: z.string(),
  photo: photoSchema.optional(),
});
const changeSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
  cents,
  days: z.number().int().min(0).max(365),
  status: z.enum(["pending", "approved", "declined"]),
  decidedAt: z.string().optional(),
});
const paymentSchema = z.object({
  id: z.string(),
  cents: cents.positive(),
  date: z.string(),
  method: z.string(),
  note: z.string(),
});
const punchSchema = z.object({
  id: z.string(),
  title: z.string(),
  note: z.string(),
  status: z.enum(["open", "review", "resolved"]),
  photo: photoSchema.optional(),
  resolution: z.string().optional(),
});
const quoteSchema = z.object({
  id: z.string(),
  company: z.string(),
  cents,
  depositPercent: z.number().min(0).max(100),
  durationDays: z.number().int().positive(),
  start: z.string(),
  cleanup: z.boolean(),
  items: z.array(z.object({ label: z.string(), cents })),
});
export type Quote = z.infer<typeof quoteSchema>;
export const memberSchema = z.object({ name: z.string(), role: roleSchema });
export type Member = z.infer<typeof memberSchema>;
export const inviteSchema = z.object({ code: z.string(), expiresAt: z.string() });
export type Invite = z.infer<typeof inviteSchema>;
export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  scope: z.string(),
  zip: z.string(),
  timing: z.string(),
  area: z.string(),
  photos: z.array(photoSchema),
  isSample: z.boolean(),
  status: z.enum(["planning", "active", "completed"]),
  quote: quoteSchema.nullable(),
  quotes: z.array(quoteSchema),
  finish: z.string().nullable(),
  changes: z.array(changeSchema),
  payments: z.array(paymentSchema),
  punch: z.array(punchSchema),
  events: z.array(eventSchema),
  completedAt: z.string().optional(),
  // Set by the server for shared projects; absent in the on-device sample notebook.
  viewerRole: roleSchema.optional(),
  members: z.array(memberSchema).optional(),
  // Only returned to the homeowner while an invite is open.
  invite: inviteSchema.nullable().optional(),
});
export type Project = z.infer<typeof projectSchema>;
/**
 * The viewer's role on one project. The sample project follows the
 * homeowner/contractor preview switch; real projects use membership.
 */
export const roleIn = (p: Project, state: Pick<AppState, "role">): Role =>
  p.isSample ? state.role : (p.viewerRole ?? "homeowner");
export const contractorOf = (p: Project) =>
  p.members?.find((m) => m.role === "contractor");
export const latestQuote = (p: Project) => p.quotes[p.quotes.length - 1];
export const appStateSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  role: roleSchema,
  welcomed: z.boolean(),
  projects: z.array(projectSchema),
  savedGuides: z.array(z.string()),
  draft: draftSchema,
});
export type AppState = z.infer<typeof appStateSchema>;
export const emptyDraft: Draft = {
  title: "",
  type: "Kitchen",
  scope: "",
  zip: "",
  timing: "Within a month",
  area: "",
  photos: [],
};
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
export const total = (p: Project) =>
  (p.quote?.cents ?? 0) +
  p.changes
    .filter((c) => c.status === "approved")
    .reduce((s, c) => s + c.cents, 0);
export const paid = (p: Project) =>
  p.payments.reduce((s, payment) => s + payment.cents, 0);
export const remaining = (p: Project) => total(p) - paid(p);
export const statusLabel = (p: Project) =>
  ({ planning: "Planning", active: "In progress", completed: "Completed" })[
    p.status
  ];
export function parseMoney(input: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(input.trim()))
    throw new Error("Enter an amount with up to two decimal places.");
  const result = Math.round(Number(input) * 100);
  if (!Number.isSafeInteger(result) || result <= 0 || result > 100_000_000)
    throw new Error("Enter an amount between $0.01 and $1,000,000.");
  return result;
}
export function dateLabel(date: string) {
  return new Date(
    date.length === 10 ? date + "T12:00:00" : date,
  ).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export const quoteTotal = (items: { cents: number }[]) =>
  items.reduce((sum, item) => sum + item.cents, 0);
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateDraft(d: Draft) {
  if (d.title.trim().length < 3)
    throw new Error("Give your project a name with at least 3 characters.");
  if (d.scope.trim().length < 12)
    throw new Error("Add a little more detail about the work you need.");
  if (!/^\d{5}$/.test(d.zip))
    throw new Error("Enter a valid five-digit ZIP code.");
}
