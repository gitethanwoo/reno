import { Stack, router } from "expo-router";
import { View } from "react-native";
import { confirm } from "@/lib/confirm";
import { finish } from "@/lib/navigation";
import { useProject } from "@/features/use-project";
import { money, dateLabel, latestQuote, Quote } from "@/domain/model";
import {
  Badge,
  Button,
  Card,
  Copy,
  Divider,
  Empty,
  ErrorNote,
  Eyebrow,
  Heading,
  LineItem,
  Note,
  Screen,
  Title,
  plural,
  useTask,
} from "@/components/ui";
import { colors, fonts } from "@/components/theme";
export default function Quotes() {
  const { project: p, role, commit } = useProject();
  const task = useTask();
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const latest = latestQuote(p);
  // Revisions replace earlier versions from the same company; only the newest is compared.
  const columns = p.quotes.filter(
    (q, i) => !p.quotes.slice(i + 1).some((n) => n.company === q.company),
  );
  const earlier = p.quotes.filter((q) => !columns.includes(q));
  const canAccept = role === "homeowner" && p.status === "planning" && !!latest;
  // Line items: the accepted quote, or the one waiting for a decision.
  const detail = p.quote ?? (p.status === "planning" ? latest : undefined);
  const rows: {
    label: string;
    value: (q: Quote) => string;
    missing?: (q: Quote) => boolean;
  }[] = [
    { label: "Price", value: (q) => money(q.cents) },
    { label: "Start", value: (q) => dateLabel(q.start) },
    { label: "Duration", value: (q) => plural(q.durationDays, "day") },
    { label: "Deposit", value: (q) => q.depositPercent + "%" },
    {
      label: "Cleanup",
      value: (q) => (q.cleanup ? "Included" : "Not listed"),
      missing: (q) => !q.cleanup,
    },
  ];
  return (
    <Screen
      footer={
        canAccept ? (
          <Button
            title={"Accept " + latest.company + "’s quote"}
            icon="check"
            busy={task.busy}
            onPress={() =>
              // Accepting fixes the price and schedule, so confirm the terms.
              confirm({
                title: "Accept " + latest.company + "’s quote?",
                message:
                  money(latest.cents) +
                  " · " +
                  latest.depositPercent +
                  "% deposit · starts " +
                  dateLabel(latest.start) +
                  ". After this, changes go through change requests.",
                action: "Accept quote",
                onConfirm: () =>
                  task.run(async () => {
                    await commit({
                      type: "accept-quote",
                      projectId: p.id,
                      quoteId: latest.id,
                      at: new Date().toISOString(),
                    });
                    finish(p.id);
                  }),
              })
            }
          />
        ) : undefined
      }
    >
      <Stack.Screen
        options={{ title: columns.length > 1 ? "Compare quotes" : "Quote" }}
      />
      <Title
        sub={
          columns.length > 1
            ? "The same fields for every contractor, so gaps are easy to spot."
            : undefined
        }
      >
        {columns.length > 1 ? "Compare quotes" : "Quote"}
      </Title>
      {!p.quotes.length ? (
        <Empty
          title="No quotes yet."
          text={
            role === "contractor"
              ? "Send your quote from the project overview. The homeowner sees every line."
              : "Invite your contractor from the project overview. Their quote appears here, line by line."
          }
        />
      ) : (
        <>
          {p.isSample && <Note>These are fictional sample quotes.</Note>}
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            <View style={[row, { backgroundColor: colors.paper }]}>
              <View style={{ flex: 1.1 }} />
              {columns.map((q) => (
                <View key={q.id} style={{ flex: 1, gap: 4 }}>
                  {q.id === p.quote?.id && <Badge>Chosen</Badge>}
                  <Copy
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 14,
                      lineHeight: 19,
                    }}
                  >
                    {q.company}
                  </Copy>
                </View>
              ))}
            </View>
            {rows.map((r) => (
              <View
                key={r.label}
                style={[
                  row,
                  { borderTopWidth: 1, borderTopColor: colors.line },
                ]}
              >
                <Copy tone="muted" style={{ flex: 1.1, fontSize: 14 }}>
                  {r.label}
                </Copy>
                {columns.map((q) => (
                  <Copy
                    key={q.id}
                    tone={r.missing?.(q) ? "rust" : undefined}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily:
                        r.label === "Price" ? fonts.bold : fonts.medium,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {r.value(q)}
                  </Copy>
                ))}
              </View>
            ))}
          </Card>
          {columns.some((q) => !q.cleanup) && (
            <Note warning>
              {columns.length > 1
                ? "Not every quote lists cleanup. Ask before you choose, so it isn’t an extra charge later."
                : "This quote doesn’t list cleanup. Ask before you accept, so it isn’t an extra charge later."}
            </Note>
          )}
          {detail && (
            <Card>
              <View style={{ gap: 4 }}>
                <Eyebrow>
                  {p.quote
                    ? "Accepted quote"
                    : earlier.length
                      ? "Latest version"
                      : "Waiting for your decision"}
                </Eyebrow>
                <Heading small>{detail.company}</Heading>
              </View>
              {detail.items.map((i, n) => (
                <LineItem
                  key={n + i.label}
                  label={i.label}
                  value={money(i.cents)}
                />
              ))}
              <Divider />
              <LineItem
                label="Quote total"
                value={money(detail.cents)}
                strong
              />
            </Card>
          )}
          {earlier.length > 0 && (
            <View style={{ gap: 8 }}>
              <Heading small>Earlier versions</Heading>
              <Card style={{ gap: 4 }}>
                {earlier.map((q) => (
                  <LineItem
                    key={q.id}
                    label={q.company + " · " + money(q.cents)}
                    value="Replaced"
                    tone="muted"
                  />
                ))}
              </Card>
            </View>
          )}
          {canAccept && (
            <Note>
              Accepting sets the price, start date and schedule. After that,
              changes go through change requests.
            </Note>
          )}
          <ErrorNote error={task.error} />
          {p.quote && (
            <Button
              title="Review the terms"
              icon="arrow"
              onPress={() =>
                router.push({
                  pathname: "/project/[id]/terms",
                  params: { id: p.id },
                })
              }
            />
          )}
        </>
      )}
    </Screen>
  );
}
const row = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 10,
  paddingHorizontal: 16,
  paddingVertical: 12,
};
