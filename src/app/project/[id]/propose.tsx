import { useState } from "react";
import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import { parseMoney } from "@/domain/model";
import {
  Button,
  Empty,
  ErrorNote,
  Field,
  Heading,
  Note,
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
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  return (
    <Screen
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
              router.back();
            })
          }
        />
      }
    >
      <Heading>Put the change{"\n"}in writing.</Heading>
      <Field
        label="Change title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Edge trim upgrade"
        maxLength={100}
      />
      <Field
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
      />
      <Field
        label="Extra days"
        value={days}
        onChangeText={setDays}
        keyboardType="number-pad"
        maxLength={3}
      />
      <Note>
        This is a proposal. Wait for the homeowner’s approval before starting
        the change.
      </Note>
      <ErrorNote error={task.error} />
    </Screen>
  );
}
