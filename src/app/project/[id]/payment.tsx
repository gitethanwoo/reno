import { useState } from "react";
import { DateField } from "@/components/date-field";
import { today } from "@/lib/date";
import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import { money, parseMoney, remaining } from "@/domain/model";
import {
  Button,
  Empty,
  ErrorNote,
  Chips,
  Field,
  Note,
  Screen,
  Title,
  useTask,
} from "@/components/ui";
export default function Payment() {
  const { project: p, commit } = useProject();
  const task = useTask();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
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
      <Title sub={money(remaining(p)) + " left on the approved total."}>
        Log a payment
      </Title>
      <Field
        label="Amount paid ($)"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <DateField
        label="Date paid"
        value={date}
        onChange={setDate}
        max={today()}
      />
      <Chips
        label="How did you pay?"
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
        This records a payment you already made. No money moves through Reno,
        and it isn’t proof the contractor received it.
      </Note>
      <ErrorNote error={task.error} />
    </Screen>
  );
}
