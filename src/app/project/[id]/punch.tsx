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
  Eyebrow,
  Field,
  Heading,
  Note,
  Screen,
  Title,
  useTask,
} from "@/components/ui";
import { View } from "react-native";
export default function Punch() {
  const { project: p, params, role, commit } = useProject();
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
        <Title sub="Your contractor submits a fix, then you decide whether it’s resolved.">
          Add a punch item
        </Title>
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
  const homeowner = role === "homeowner",
    closed = p.status === "completed";
  // Who can act on the item right now, and how.
  const canReview = homeowner && item.status === "review";
  const canReopen = homeowner && item.status === "resolved";
  const canSubmit = !homeowner && item.status === "open";
  const acting = !closed && (canReview || canReopen || canSubmit);
  return (
    <Screen keyboard>
      <View style={{ gap: 10 }}>
        <Badge warm={item.status !== "resolved"}>
          {item.status === "review"
            ? homeowner
              ? "Fix submitted · Ready for your review"
              : "Fix submitted · Waiting for homeowner"
            : item.status === "resolved"
              ? "Resolved"
              : "Open"}
        </Badge>
        <Heading>{item.title}</Heading>
        <Copy>{item.note}</Copy>
      </View>
      {item.resolution && (
        <Card>
          <Eyebrow>Latest note</Eyebrow>
          <Copy>{item.resolution}</Copy>
        </Card>
      )}
      {acting && (
        <Field
          label={
            canSubmit
              ? "What did you fix?"
              : canReview
                ? "Note (needed if it still needs work)"
                : "Why are you reopening it?"
          }
          value={note}
          onChangeText={setNote}
          multiline
          placeholder={
            canSubmit
              ? "Tell the homeowner what you fixed."
              : "What still needs attention?"
          }
          maxLength={1000}
        />
      )}
      {!closed && canReview && (
        <Button
          title="Accept the fix"
          icon="check"
          busy={task.busy}
          onPress={() => act("resolved")}
        />
      )}
      {!closed && (canReview || canReopen) && (
        <Button
          title={canReopen ? "Reopen item" : "Needs more work"}
          variant="secondary"
          disabled={task.busy}
          onPress={() => act("open")}
        />
      )}
      {!closed && canSubmit && (
        <Button
          title="Send for homeowner review"
          busy={task.busy}
          onPress={() => act("review")}
        />
      )}
      {!closed && !acting && (
        <Note>
          {homeowner
            ? "Waiting for your contractor to submit a fix. You’ll decide whether it’s resolved."
            : "Waiting for the homeowner to review your fix. Only they can close the item."}
        </Note>
      )}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
