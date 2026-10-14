import { useState } from "react";
import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import { money, parseMoney, remaining } from "@/domain/model";
import {
  Button,
  Copy,
  Empty,
  ErrorNote,
  Field,
  Heading,
  Note,
  Screen,
  Segments,
  useTask,
} from "@/components/ui";
export default function Payment() {
  const { project: p, commit } = useProject();
  const task = useTask();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Bank transfer");
  const [note, setNote] = useState("");
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
          title="Save payment record"
          busy={task.busy}
          onPress={() =>
            task.run(async () => {
              await commit({
                type: "payment",
                projectId: p.id,
                id,
                cents: parseMoney(amount),
                date,
                method,
                note,
                at: new Date().toISOString(),
              });
              router.back();
            })
          }
        />
      }
    >
      <Heading>Keep the{"\n"}receipt.</Heading>
      <Copy tone="muted">Remaining balance · {money(remaining(p))}</Copy>
      <Field
        label="Amount paid ($)"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Field
        label="Payment date (YYYY-MM-DD)"
        placeholder="2026-10-21"
        value={date}
        onChangeText={setDate}
        maxLength={10}
      />
      <Copy>How did you pay?</Copy>
      <Segments
        value={method}
        onChange={setMethod}
        options={["Bank transfer", "Card", "Cash", "Check"].map((value) => ({
          label: value,
          value,
        }))}
      />
      <Field
        label="What was it for?"
        placeholder="e.g. Final payment"
        value={note}
        onChangeText={setNote}
        maxLength={200}
      />
      <Note>
        This records a payment you already made. No money moves through Reno.
      </Note>
      <ErrorNote error={task.error} />
    </Screen>
  );
}
