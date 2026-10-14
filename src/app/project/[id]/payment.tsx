import { useState } from "react";
import { useDiscardGuard } from "@/lib/discard";
import { DateField } from "@/components/date-field";
import { today } from "@/lib/date";
import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import { depositFor, money, paid, parseMoney, remaining } from "@/domain/model";
import { amountOf } from "@/lib/money-input";
import {
  AmountField,
  Button,
  Empty,
  Chips,
  Field,
  Note,
  Screen,
  Suggestions,
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
  const allowLeave = useDiscardGuard(!!amount.trim() || !!note.trim());
  if (!p)
    return (
      <Screen error={task.error}>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const left = remaining(p);
  // Suggest the accepted quote's deposit until anything has been logged.
  const deposit =
    p.quote && paid(p) === 0
      ? depositFor(p.quote.cents, p.quote.depositPercent)
      : 0;
  const suggest = (cents: number, purpose: string) => () => {
    setAmount(amountOf(cents));
    if (!note.trim()) setNote(purpose);
  };
  const suggestions = [
    ...(deposit > 0 && deposit !== left
      ? [
          {
            label: "Deposit " + money(deposit),
            onPress: suggest(deposit, "Deposit"),
          },
        ]
      : []),
    ...(left > 0
      ? [
          {
            label: "Remaining " + money(left),
            onPress: suggest(left, "Final payment"),
          },
        ]
      : []),
  ];
  return (
    <Screen
      error={task.error}
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
              allowLeave();
              router.back();
            })
          }
        />
      }
    >
      <Title sub={money(left) + " left on the approved total."}>
        Log a payment
      </Title>
      {suggestions.length > 0 && <Suggestions options={suggestions} />}
      <AmountField
        label="Amount paid"
        value={amount}
        onChange={setAmount}
        // Logging the amount is why this sheet opened; the suggestions
        // above it stay in view.
        autoFocus
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
    </Screen>
  );
}
