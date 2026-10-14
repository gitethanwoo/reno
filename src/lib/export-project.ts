import { Share } from "react-native";
import { Project, money, total, paid } from "@/domain/model";
export function projectText(p: Project) {
  return [
    "RENO · PROJECT RECORD",
    p.title,
    p.isSample ? "Fictional sample project" : "",
    "Status: " + p.status,
    "Scope: " + p.scope,
    "Contractor: " + (p.quote?.company ?? "Not chosen"),
    "Approved: " + money(total(p)),
    "Payments logged: " + money(paid(p)),
    "",
    "CHANGES",
    ...p.changes.map(
      (c) =>
        c.title +
        ": " +
        c.status +
        " · " +
        money(c.cents) +
        " · " +
        c.days +
        " day(s)",
    ),
    "",
    "PAYMENTS (ENTERED RECORDS)",
    ...p.payments.map(
      (x) =>
        x.date + " · " + money(x.cents) + " · " + x.method + " · " + x.note,
    ),
    "",
    "PUNCH LIST",
    ...p.punch.map((x) => x.title + " · " + x.status),
    "",
    "PROJECT TIMELINE",
    ...p.events.map((x) => x.at + " · " + x.author + ": " + x.text),
  ].join("\n");
}
export async function exportProject(p: Project) {
  await Share.share({ title: p.title + " · Reno", message: projectText(p) });
}
