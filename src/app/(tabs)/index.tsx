import { router } from "expo-router";
import { View } from "react-native";
import { useStore } from "@/state/store";
import {
  Badge,
  Button,
  Card,
  Copy,
  Empty,
  Eyebrow,
  Heading,
  Row,
  Screen,
  Title,
  plural,
} from "@/components/ui";
import { waitingOn } from "@/features/waiting";
import { colors } from "@/components/theme";
import { ProjectCard } from "@/components/project-card";
import { Icon } from "@/components/icon";
export default function Home() {
  const { state } = useStore();
  const contractor = state.role === "contractor";
  const active = state.projects.filter((p) => p.status !== "completed");
  const waiting = waitingOn(state);
  const next = waiting[0];
  return (
    <Screen>
      <Title
        sub={
          waiting.length
            ? plural(waiting.length, "thing") + " waiting on you."
            : contractor
              ? "Your jobs, updates and changes in one place."
              : "Everything on your projects is up to date."
        }
      >
        {"Hello, " + (state.name || "there") + "."}
      </Title>
      {next && (
        <Card style={{ backgroundColor: colors.amber, borderColor: "#E7CFB0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="bell" size={20} />
            <Eyebrow>Your move</Eyebrow>
          </View>
          <Heading small>{next.title}</Heading>
          <Copy>{next.detail}</Copy>
          <Button
            title={next.action}
            variant="secondary"
            icon="arrow"
            onPress={() => router.push(next.href)}
          />
          {waiting.length > 1 && (
            <Row
              title={"See all " + waiting.length}
              onPress={() => router.push("/notifications")}
            />
          )}
        </Card>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Heading small>{contractor ? "Your jobs" : "Your projects"}</Heading>
        <Badge>{active.length} active</Badge>
      </View>
      {active.length ? (
        active.slice(0, 3).map((p) => <ProjectCard project={p} key={p.id} />)
      ) : (
        <Empty
          title="No active projects."
          text="Describe one job, add a few photos, and keep every decision in one place."
        />
      )}
      {!contractor && (
        <Button
          title="Start a project"
          icon="plus"
          variant={active.length ? "secondary" : "primary"}
          onPress={() => router.push("/new-project")}
        />
      )}
      <Card style={{ backgroundColor: colors.sage }}>
        <Eyebrow>Guide · 5 min</Eyebrow>
        <Heading small>Before you hire</Heading>
        <Copy tone="muted">Five questions to ask every contractor.</Copy>
        <Row
          title="Read the guide"
          icon="book"
          onPress={() => router.push("/guides/before-you-hire")}
        />
      </Card>
    </Screen>
  );
}
