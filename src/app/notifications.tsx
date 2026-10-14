import { router } from "expo-router";
import { useStore } from "@/state/store";
import { Card, Copy, Empty, Row, Screen } from "@/components/ui";
import { waitingOn } from "@/features/waiting";

export default function Notifications() {
  const { state } = useStore();
  const items = waitingOn(state);
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
