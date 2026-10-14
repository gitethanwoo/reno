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
import { money } from "@/domain/model";
import { colors } from "@/components/theme";
import { ProjectCard } from "@/components/project-card";
import { Icon } from "@/components/icon";
export default function Home() {
  const { state } = useStore();
  const contractor = state.role === "contractor";
  const active = state.projects.filter((p) => p.status !== "completed");
  const pendingProject = active.find((p) =>
    p.changes.some((c) => c.status === "pending"),
  );
  const pending = pendingProject?.changes.find((c) => c.status === "pending");
  return (
    <Screen>
      <Title
        sub={
          pending && !contractor
            ? "One decision is waiting for you."
            : contractor
              ? "Your jobs, updates and changes in one place."
              : "Everything on your projects is up to date."
        }
      >
        {"Hello, " + (state.name || "there") + "."}
      </Title>
      {pendingProject && pending && !contractor && (
        <Card style={{ backgroundColor: colors.amber, borderColor: "#E7CFB0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="bell" size={20} />
            <Eyebrow>Your decision, next</Eyebrow>
          </View>
          <Heading small>{pending.title}</Heading>
          <Copy>
            {pendingProject.title} · +{money(pending.cents)} · +
            {plural(pending.days, "day")}
          </Copy>
          <Button
            title="Review change"
            variant="secondary"
            icon="arrow"
            onPress={() =>
              router.push({
                pathname: "/project/[id]/change",
                params: { id: pendingProject.id, changeId: pending.id },
              })
            }
          />
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
