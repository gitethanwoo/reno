import { Href, router } from "expo-router";
import { useStore } from "@/state/store";
import { latestQuote, money, roleIn } from "@/domain/model";
import { Card, Copy, Empty, Row, Screen } from "@/components/ui";
import { IconName } from "@/components/icon";

type Item = {
  key: string;
  title: string;
  detail: string;
  icon: IconName;
  href: Href;
};

export default function Notifications() {
  const { state } = useStore();
  // What needs the viewer depends on their role in each project.
  const items = state.projects.flatMap((p): Item[] => {
    const id = p.id;
    if (roleIn(p, state) === "homeowner") {
      const latest = latestQuote(p);
      return [
        ...(p.status === "planning" && latest
          ? [
              {
                key: id + "quote" + latest.id,
                title: "Quote from " + latest.company,
                detail:
                  p.title + " · " + money(latest.cents) + " · Ready to review",
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
            detail: p.title + " · Awaiting approval",
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
          icon: "tools" as const,
          href: {
            pathname: "/project/[id]/punch",
            params: { id, itemId: i.id },
          } as const,
        })),
    ];
  });
  return (
    <Screen>
      <Copy tone="muted">What’s waiting on you, across your projects.</Copy>
      {items.map((item) => (
        <Card key={item.key}>
          <Row
            title={item.title}
            detail={item.detail}
            icon={item.icon}
            onPress={() => router.push(item.href)}
          />
        </Card>
      ))}
      {!items.length && (
        <Empty
          title="You’re all caught up."
          text="New project decisions will appear here."
        />
      )}
    </Screen>
  );
}
