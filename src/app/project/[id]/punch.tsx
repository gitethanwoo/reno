import { useState } from "react";
import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import {
  Badge,
  Button,
  Card,
  Copy,
  Empty,
  ErrorNote,
  Field,
  Heading,
  Note,
  Screen,
  useTask,
} from "@/components/ui";
export default function Punch() {
  const { project: p, params, state, commit } = useProject();
  const task = useTask();
  const item = p?.punch.find((i) => i.id === params.itemId);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [id] = useState(uid);
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const act = (status: "review" | "open" | "resolved") =>
    task.run(async () => {
      if (!item) return;
      await commit({
        type: "punch-review",
        projectId: p.id,
        id: item.id,
        status,
        note,
        at: new Date().toISOString(),
      });
      router.back();
    });
  if (!item)
    return (
      <Screen
        keyboard
        footer={
          <Button
            title="Add to punch list"
            busy={task.busy}
            onPress={() =>
              task.run(async () => {
                await commit({
                  type: "punch-add",
                  projectId: p.id,
                  id,
                  title,
                  note,
                  at: new Date().toISOString(),
                });
                router.back();
              })
            }
          />
        }
      >
        <Heading>The details{"\n"}make the difference.</Heading>
        <Field
          label="What needs attention?"
          placeholder="e.g. Finish the window edge"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Field
          label="A little more detail"
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Where is it? What should be different?"
          maxLength={1000}
        />
        <ErrorNote error={task.error} />
      </Screen>
    );
  const homeowner = state.role === "homeowner",
    closed = p.status === "completed";
  return (
    <Screen keyboard>
      <Badge warm={item.status !== "resolved"}>
        {item.status === "review"
          ? "Ready for review"
          : item.status === "resolved"
            ? "Resolved"
            : "Open"}
      </Badge>
      <Heading>{item.title}</Heading>
      <Copy>{item.note}</Copy>
      {item.resolution && (
        <Card>
          <Copy>{item.resolution}</Copy>
        </Card>
      )}
      {!closed && (
        <>
          <Field
            label={homeowner ? "Your review note" : "Explain the fix"}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder={
              homeowner
                ? "What still needs attention?"
                : "Tell the homeowner what you fixed."
            }
            maxLength={1000}
          />
          {homeowner && item.status === "review" && (
            <Button
              title="Accept the fix"
              icon="check"
              busy={task.busy}
              onPress={() => act("resolved")}
            />
          )}
          {homeowner && item.status !== "open" && (
            <Button
              title="Needs more work"
              variant="secondary"
              disabled={task.busy}
              onPress={() => act("open")}
            />
          )}
          {!homeowner && item.status === "open" && (
            <Button
              title="Send for homeowner review"
              busy={task.busy}
              onPress={() => act("review")}
            />
          )}
        </>
      )}
      <Note>
        {homeowner && item.status === "open"
          ? "The contractor submits a fix first. You then review it and decide whether it is resolved."
          : "Only the homeowner can accept a fix and close the item."}
      </Note>
      <ErrorNote error={task.error} />
    </Screen>
  );
}
