import { useState } from "react";
import { router } from "expo-router";
import { useStore } from "@/state/store";
import { Button, Empty, Heading, Screen, Segments } from "@/components/ui";
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
      <Heading>Your work,{"\n"}in order.</Heading>
      <Segments
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
            filter === "completed" ? "Good endings live here." : "A fresh page."
          }
          text={
            filter === "completed"
              ? "Completed jobs and their records will be kept here."
              : "Start with a clear scope for your next project."
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
