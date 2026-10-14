import { Redirect, router } from "expo-router";
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
} from "@/components/ui";
import { colors } from "@/components/theme";
import { ProjectCard } from "@/components/project-card";
import { Icon } from "@/components/icon";
export default function Home() {
  const { state } = useStore();
  if (!state.welcomed) return <Redirect href="/welcome" />;
  const contractor = state.role === "contractor";
  const active = state.projects.filter((p) => p.status !== "completed");
  const pendingProject = active.find((p) =>
    p.changes.some((c) => c.status === "pending"),
  );
  const pending = pendingProject?.changes.find((c) => c.status === "pending");
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Eyebrow>
          {contractor
            ? "Reno for contractors"
            : "A little clarity goes a long way"}
        </Eyebrow>
        <Heading>
          {contractor
            ? "Good work.\nAll in one place."
            : "Home,\na little closer."}
        </Heading>
        <Copy tone="muted">
          {contractor
            ? "Keep every job moving, together."
            : "Hello, " + state.name + ". Let’s make good progress."}
        </Copy>
      </View>
      {!contractor && (
        <Button
          title="Start a project"
          icon="plus"
          onPress={() => router.push("/new-project")}
        />
      )}
      {pendingProject && pending && !contractor && (
        <Card style={{ backgroundColor: colors.amber, borderColor: "#E7CFB0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="bell" size={20} />
            <Eyebrow>Your decision, next</Eyebrow>
          </View>
          <Copy>{pending.title} is ready for your review.</Copy>
          <Button
            title="Review proposed change"
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
          title="Room for something new."
          text="Start with one job. We’ll keep the details together."
        />
      )}
      <Card style={{ backgroundColor: colors.sage }}>
        <Eyebrow>Reno field notes</Eyebrow>
        <Heading small>A better beginning.</Heading>
        <Copy tone="muted">Five questions to ask before you hire.</Copy>
        <Row
          title="Read the guide"
          icon="book"
          onPress={() => router.push("/guides/before-you-hire")}
        />
      </Card>
    </Screen>
  );
}
