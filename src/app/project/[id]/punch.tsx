import { useState } from "react";
import { router } from "expo-router";
import { useDiscardGuard } from "@/lib/discard";
import { useProject } from "@/features/use-project";
import {
  Badge,
  Button,
  Card,
  Copy,
  Empty,
  Eyebrow,
  Field,
  Heading,
  Note,
  Screen,
  useTask,
} from "@/components/ui";
import { View } from "react-native";
export default function Punch() {
  const { project: p, params, role, commit } = useProject();
  const task = useTask();
  const item = p?.punch.find((i) => i.id === params.itemId);
  const [note, setNote] = useState("");
  // Null until the homeowner edits, so the field shows the saved detail.
  const [detail, setDetail] = useState<string | null>(null);
  const edited = !!item && detail !== null && detail.trim() !== item.note;
  const allowLeave = useDiscardGuard(edited || !!note.trim());
  if (!p)
    return (
      <Screen error={task.error}>
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
      allowLeave();
      router.back();
    });
  if (!item)
    return (
      <Screen error={task.error}>
        <Empty
          title="This item could not be found."
          text="Return to the project’s punch list."
        />
      </Screen>
    );
  const homeowner = role === "homeowner",
    closed = p.status === "completed";
  // Who can act on the item right now, and how.
  const canReview = homeowner && item.status === "review";
  const canReopen = homeowner && item.status === "resolved";
  const canSubmit = !homeowner && item.status === "open";
  // Until the contractor responds, the homeowner can add detail.
  const canEdit = !closed && homeowner && item.status === "open";
  const acting = !closed && (canReview || canReopen || canSubmit);
  const saveDetail = () =>
    task.run(async () => {
      await commit({
        type: "punch-edit",
        projectId: p.id,
        id: item.id,
        note: detail ?? item.note,
        at: new Date().toISOString(),
      });
      setDetail(null);
    });
  return (
    <Screen error={task.error} keyboard>
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
        {!canEdit && !!item.note && <Copy>{item.note}</Copy>}
      </View>
      {canEdit && (
        <Field
          label="Detail"
          multiline
          value={detail ?? item.note}
          onChangeText={setDetail}
          placeholder="Where is it? What should be different?"
          maxLength={1000}
        />
      )}
      {canEdit && edited && (
        <Button title="Save detail" busy={task.busy} onPress={saveDetail} />
      )}
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
    </Screen>
  );
}
