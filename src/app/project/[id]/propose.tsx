import { useRef, useState } from "react";
import { useDiscardGuard } from "@/lib/discard";
import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import { parseMoney } from "@/domain/model";
import {
  Button,
  Empty,
  Field,
  type FieldHandle,
  Note,
  Title,
  Screen,
  useTask,
} from "@/components/ui";
export default function Propose() {
  const { project: p, commit } = useProject();
  const task = useTask();
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("0");
  const [id] = useState(uid);
  const reasonField = useRef<FieldHandle>(null);
  const daysField = useRef<FieldHandle>(null);
  const allowLeave = useDiscardGuard(
    !!title.trim() || !!reason.trim() || !!amount.trim(),
  );
  if (!p)
    return (
      <Screen error={task.error}>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  return (
    <Screen
      error={task.error}
      keyboard
      footer={
        <Button
          title="Send for approval"
          busy={task.busy}
          onPress={() =>
            task.run(async () => {
              if (!/^\d+$/.test(days))
                throw Error("Enter a whole number of extra days.");
              await commit({
                type: "propose-change",
                projectId: p.id,
                id,
                title,
                reason,
                cents: amount.trim() === "0" ? 0 : parseMoney(amount),
                days: Number(days),
                at: new Date().toISOString(),
              });
              allowLeave();
              router.back();
            })
          }
        />
      }
    >
      <Title sub="The homeowner sees the cost and time before deciding. Nothing changes until they approve.">
        Propose a change
      </Title>
      <Field
        label="Change title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Edge trim upgrade"
        maxLength={100}
        // A blank compose sheet: start typing, like Mail.
        autoFocus
        onNext={() => reasonField.current?.focus()}
      />
      <Field
        ref={reasonField}
        label="Why is it needed?"
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={1000}
      />
      <Field
        label="Added cost ($)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        maxLength={10}
        onNext={() => daysField.current?.focus()}
      />
      <Field
        ref={daysField}
        label="Extra days"
        value={days}
        onChangeText={(v) => setDays(v.replace(/\D/g, ""))}
        selectTextOnFocus
        keyboardType="number-pad"
        maxLength={3}
      />
      <Note>Don’t start this work until the homeowner approves it.</Note>
    </Screen>
  );
}
