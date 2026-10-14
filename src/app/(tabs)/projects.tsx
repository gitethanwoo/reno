import { useState } from "react";
import { router } from "expo-router";
import { useStore } from "@/state/store";
import { Button, Empty, Screen, Tabs, Title } from "@/components/ui";
import { ProjectCard } from "@/components/project-card";
export default function Projects() {
  const { state } = useStore();
  const [filter, setFilter] = useState("active");
  const projects = state.projects.filter((p) =>
    filter === "completed"
      ? p.status === "completed"
      : p.status !== "completed",
  );
  return (
    <Screen>
      <Title>Projects</Title>
      <Tabs
        value={filter}
        onChange={setFilter}
        options={[
          { label: "Active", value: "active" },
          { label: "Completed", value: "completed" },
        ]}
      />
      {projects.length ? (
        projects.map((p) => <ProjectCard key={p.id} project={p} />)
      ) : (
        <Empty
          title={
            filter === "completed"
              ? "No completed projects yet."
              : "No active projects."
          }
          text={
            filter === "completed"
              ? "Finished jobs keep their quote, changes, payments and punch list here."
              : "Describe one job, add a few photos, and keep every decision in one place."
          }
        />
      )}
      {state.role === "homeowner" && (
        <Button
          title="Start a project"
          icon="plus"
          onPress={() => router.push("/new-project")}
        />
      )}
    </Screen>
  );
}
