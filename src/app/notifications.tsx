import { router } from "expo-router";
import { useStore } from "@/state/store";
import { Card, Copy, Empty, Heading, Row, Screen } from "@/components/ui";
export default function Notifications() {
  const { state } = useStore();
  const pending = state.projects.flatMap((p) =>
    p.changes.filter((c) => c.status === "pending").map((c) => ({ p, c })),
  );
  return (
    <Screen>
      <Heading>A few things{"\n"}to keep in view.</Heading>
      <Copy tone="muted">Decisions that help your project move forward.</Copy>
      {pending.map(({ p, c }) => (
        <Card key={p.id + c.id}>
          <Row
            title={c.title}
            detail={p.title + " · Awaiting approval"}
            icon="bell"
            onPress={() =>
              router.push({
                pathname: "/project/[id]/change",
                params: { id: p.id, changeId: c.id },
              })
            }
          />
        </Card>
      ))}
      {!pending.length && (
        <Empty
          title="All caught up."
          text="New project decisions will appear here."
        />
      )}
    </Screen>
  );
}
