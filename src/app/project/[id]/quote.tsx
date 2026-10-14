import { useState } from "react";
import { useDiscardGuard } from "@/lib/discard";
import { DateField } from "@/components/date-field";
import { today } from "@/lib/date";
import { router } from "expo-router";
import { View } from "react-native";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import {
  depositFor,
  lastCompany,
  latestQuote,
  money,
  parseMoney,
  quoteTotal,
} from "@/domain/model";
import { useAskForPush } from "@/lib/push";
import { amountOf, cleanAmount, formatAmount } from "@/lib/money-input";
import { Segmented } from "@/components/segmented";
import { Stepper } from "@/components/stepper";
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Field,
  Heading,
  IconButton,
  LineItem,
  Note,
  plural,
  Screen,
  Title,
  useTask,
} from "@/components/ui";

type Line = { key: string; label: string; amount: string };
const blank = (): Line => ({ key: uid(), label: "", amount: "" });
/** Live total: rows that don't parse yet count as zero. */
const centsOf = (amount: string) => {
  try {
    return parseMoney(amount);
  } catch {
    return 0;
  }
};
const depositOptions = [0, 10, 25, 30, 50];

export default function SendQuote() {
  const { project: p, state, role, commit } = useProject();
  const task = useTask();
  // After quoting, offer to say when the homeowner decides.
  const askForPush = useAskForPush();
  // A revision starts from the version the homeowner already has.
  const previous = p ? latestQuote(p) : undefined;
  const [id] = useState(uid);
  const [company, setCompany] = useState(
    () => previous?.company ?? lastCompany(state) ?? state.name,
  );
  const [lines, setLines] = useState<Line[]>(() =>
    previous
      ? previous.items.map((i) => ({
          key: uid(),
          label: i.label,
          amount: amountOf(i.cents),
        }))
      : [blank()],
  );
  const [deposit, setDeposit] = useState(previous?.depositPercent ?? 30);
  const [start, setStart] = useState(previous?.start ?? today());
  const [days, setDays] = useState(previous?.durationDays ?? 1);
  const [cleanup, setCleanup] = useState(previous?.cleanup ?? true);
  const form = JSON.stringify({
    company,
    lines,
    deposit,
    start,
    days,
    cleanup,
  });
  const [initial] = useState(form);
  const allowLeave = useDiscardGuard(form !== initial);
  if (!p)
    return (
      <Screen error={task.error}>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  if (role !== "contractor" || p.status !== "planning")
    return (
      <Screen error={task.error}>
        <Empty
          title={
            role !== "contractor"
              ? "Quotes come from the contractor."
              : "A quote has already been accepted."
          }
          text={
            role !== "contractor"
              ? "Your contractor sends their quote from this project."
              : "Changes to the agreed work go through change requests."
          }
        />
      </Screen>
    );
  const edit = (key: string, patch: Partial<Line>) =>
    setLines((all) => all.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const send = () =>
    task.run(async () => {
      const items = lines
        .filter((l) => l.label.trim() || l.amount.trim())
        .map((l, i) => {
          if (!l.label.trim())
            throw new Error("Name line " + (i + 1) + " of your quote.");
          try {
            return { label: l.label, cents: parseMoney(l.amount) };
          } catch (e) {
            throw new Error(
              l.label.trim() +
                ": " +
                (e instanceof Error ? e.message : "Enter an amount."),
            );
          }
        });
      await commit({
        type: "send-quote",
        projectId: p.id,
        id,
        company,
        depositPercent: deposit,
        durationDays: days,
        start,
        cleanup,
        items,
        at: new Date().toISOString(),
      });
      allowLeave();
      router.back();
      void askForPush();
    });
  const live = quoteTotal(lines.map((l) => ({ cents: centsOf(l.amount) })));
  return (
    <Screen
      error={task.error}
      keyboard
      footer={
        <Button
          title={previous ? "Send revised quote" : "Send quote"}
          busy={task.busy}
          onPress={send}
        />
      }
    >
      <Title
        sub={
          previous
            ? "The homeowner sees the new version. Your earlier quote stays in the record."
            : p.title + " · " + p.zip
        }
      >
        {previous ? "Revise your quote" : "Send a quote"}
      </Title>
      <Field
        label="Business name"
        value={company}
        onChangeText={setCompany}
        maxLength={80}
      />
      <View style={{ gap: 12 }}>
        <Heading small>Line items</Heading>
        {lines.map((l, i) => (
          <View
            key={l.key}
            style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
          >
            <View style={{ flex: 1.6 }}>
              <Field
                label={"Item " + (i + 1)}
                placeholder="e.g. Labor"
                value={l.label}
                onChangeText={(label) => edit(l.key, { label })}
                maxLength={80}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Amount"
                placeholder="$0"
                keyboardType="decimal-pad"
                value={formatAmount(l.amount)}
                onChangeText={(text) =>
                  edit(l.key, { amount: cleanAmount(text) })
                }
              />
            </View>
            {lines.length > 1 && (
              <View style={{ paddingTop: 8 }}>
                <IconButton
                  name="close"
                  label={"Remove item " + (i + 1)}
                  onPress={() =>
                    setLines((all) => all.filter((x) => x.key !== l.key))
                  }
                />
              </View>
            )}
          </View>
        ))}
        {lines.length < 20 && (
          <Button
            title="Add a line"
            icon="plus"
            variant="secondary"
            onPress={() => setLines((all) => [...all, blank()])}
          />
        )}
      </View>
      <Card>
        <LineItem label="Quote total" value={money(live)} strong />
        <LineItem label="Deposit" value={money(depositFor(live, deposit))} />
      </Card>
      <Segmented
        label="Deposit"
        // An older quote's percent stays selectable.
        options={
          depositOptions.includes(deposit)
            ? depositOptions
            : [...depositOptions, deposit].sort((a, b) => a - b)
        }
        value={deposit}
        onChange={setDeposit}
        format={(n) => n + "%"}
      />
      <Stepper
        label="Working days"
        value={days}
        onChange={setDays}
        min={1}
        max={365}
        format={(n) => plural(n, "day")}
      />
      <DateField
        label="Start date"
        value={start}
        onChange={setStart}
        min={today()}
      />
      <Checkbox
        label="Cleanup and disposal included"
        checked={cleanup}
        onChange={setCleanup}
      />
      <Note>
        The homeowner sees every line. Once they accept, changes go through
        change requests.
      </Note>
    </Screen>
  );
}
