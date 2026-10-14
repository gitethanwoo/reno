import type { Href } from "expo-router";
import type { IconName } from "@/components/icon";
import { latestQuote, money, roleIn, type AppState } from "@/domain/model";
import { plural } from "@/components/ui";

export type Waiting = {
  key: string;
  title: string;
  detail: string;
  /** Button label for the next step, e.g. "Review quote". */
  action: string;
  icon: IconName;
  href: Href;
};

/** Everything waiting on the viewer, by their role in each project. */
export function waitingOn(state: AppState): Waiting[] {
  return state.projects
    .filter((p) => p.status !== "completed")
    .flatMap((p): Waiting[] => {
      const id = p.id;
      if (roleIn(p, state) === "homeowner") {
        const latest = latestQuote(p);
        return [
          ...(p.status === "planning" && latest
            ? [
                {
                  key: id + "quote" + latest.id,
                  title: "Quote from " + latest.company,
                  detail: p.title + " · " + money(latest.cents),
                  action: "Review quote",
                  icon: "file" as const,
                  href: {
                    pathname: "/project/[id]/quotes",
                    params: { id },
                  } as const,
                },
              ]
            : []),
          ...p.changes
            .filter((c) => c.status === "pending")
            .map((c) => ({
              key: id + c.id,
              title: c.title,
              detail:
                p.title +
                " · +" +
                money(c.cents) +
                " · +" +
                plural(c.days, "day"),
              action: "Review change",
              icon: "bell" as const,
              href: {
                pathname: "/project/[id]/change",
                params: { id, changeId: c.id },
              } as const,
            })),
          ...p.punch
            .filter((i) => i.status === "review")
            .map((i) => ({
              key: id + i.id,
              title: i.title,
              detail: p.title + " · Fix ready for your review",
              action: "Review fix",
              icon: "check" as const,
              href: {
                pathname: "/project/[id]/punch",
                params: { id, itemId: i.id },
              } as const,
            })),
        ];
      }
      return [
        ...(p.status === "planning" && !p.quotes.length
          ? [
              {
                key: id + "send-quote",
                title: "Send your quote",
                detail: p.title + " · " + p.type + " · " + p.zip,
                action: "Send quote",
                icon: "file" as const,
                href: {
                  pathname: "/project/[id]/quote",
                  params: { id },
                } as const,
              },
            ]
          : []),
        ...p.punch
          .filter((i) => i.status === "open")
          .map((i) => ({
            key: id + i.id,
            title: i.title,
            detail: p.title + " · Needs your fix",
            action: "View item",
            icon: "tools" as const,
            href: {
              pathname: "/project/[id]/punch",
              params: { id, itemId: i.id },
            } as const,
          })),
      ];
    });
}
