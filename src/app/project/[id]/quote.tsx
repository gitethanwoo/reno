import { useState } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import { latestQuote, money, parseMoney, quoteTotal } from "@/domain/model";
import {
  Button,
  Card,
  Checkbox,
  Empty,
  ErrorNote,
  Field,
  Heading,
  IconButton,
  LineItem,
  Note,
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
const wholeNumber = (value: string, message: string) => {
  if (!/^\d+$/.test(value.trim())) throw new Error(message);
  return Number(value);
};

export default function SendQuote() {
  const { project: p, state, role, commit } = useProject();
  const task = useTask();
  // A revision starts from the version the homeowner already has.
  const previous = p ? latestQuote(p) : undefined;
  const [id] = useState(uid);
  const [company, setCompany] = useState(previous?.company ?? state.name);
  const [lines, setLines] = useState<Line[]>(() =>
    previous
      ? previous.items.map((i) => ({
          key: uid(),
          label: i.label,
          amount: (i.cents / 100).toFixed(2),
        }))
      : [blank()],
  );
  const [deposit, setDeposit] = useState(
    String(previous?.depositPercent ?? 30),
  );
  const [start, setStart] = useState(
    previous?.start ?? new Date().toISOString().slice(0, 10),
  );
  const [days, setDays] = useState(
    previous ? String(previous.durationDays) : "",
  );
  const [cleanup, setCleanup] = useState(previous?.cleanup ?? true);
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  if (role !== "contractor" || p.status !== "planning")
    return (
      <Screen>
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
        depositPercent: wholeNumber(
          deposit,
          "Enter the deposit as a whole percent, like 30.",
        ),
        durationDays: wholeNumber(
          days,
          "Enter how many working days the job takes.",
        ),
        start,
        cleanup,
        items,
        at: new Date().toISOString(),
      });
      router.back();
    });
  const live = quoteTotal(lines.map((l) => ({ cents: centsOf(l.amount) })));
  return (
    <Screen
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
                label="Amount ($)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={l.amount}
                onChangeText={(amount) => edit(l.key, { amount })}
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
        <LineItem
          label="Deposit"
          value={
            /^\d+$/.test(deposit.trim())
              ? money(Math.round((live * Number(deposit)) / 100))
              : "—"
          }
        />
      </Card>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Deposit (%)"
            keyboardType="number-pad"
            value={deposit}
            onChangeText={setDeposit}
            maxLength={3}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Working days"
            placeholder="e.g. 3"
            keyboardType="number-pad"
            value={days}
            onChangeText={setDays}
            maxLength={3}
          />
        </View>
      </View>
      <Field
        label="Start date (YYYY-MM-DD)"
        placeholder="2026-10-21"
        value={start}
        onChangeText={setStart}
        maxLength={10}
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
      <ErrorNote error={task.error} />
    </Screen>
  );
}
