import { router } from "expo-router";
import { View } from "react-native";
import { useProject } from "@/features/use-project";
import { money, dateLabel, Quote } from "@/domain/model";
import {
  Badge,
  Button,
  Card,
  Copy,
  Divider,
  Empty,
  Eyebrow,
  Heading,
  LineItem,
  Note,
  Screen,
  Title,
  plural,
} from "@/components/ui";
import { colors, fonts } from "@/components/theme";
export default function Quotes() {
  const { project: p } = useProject();
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const rows: { label: string; value: (q: Quote) => string; missing?: (q: Quote) => boolean }[] = [
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
    <Screen>
      <Title
        sub={
          p.quotes.length
            ? "The same fields for every contractor, so gaps are easy to spot."
            : undefined
        }
      >
        Compare quotes
      </Title>
      {!p.quotes.length ? (
        <Empty
          title="No quotes yet."
          text="Your scope is saved. Requesting quotes from local contractors isn’t connected in this build yet."
        />
      ) : (
        <>
          {p.isSample && (
            <Note>These are fictional sample quotes.</Note>
          )}
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            <View style={[row, { backgroundColor: colors.paper }]}>
              <View style={{ flex: 1.1 }} />
              {p.quotes.map((q) => (
                <View key={q.id} style={{ flex: 1, gap: 4 }}>
                  {q.id === p.quote?.id && <Badge>Chosen</Badge>}
                  <Copy style={{ fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 }}>
                    {q.company}
                  </Copy>
                </View>
              ))}
            </View>
            {rows.map((r) => (
              <View key={r.label} style={[row, { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <Copy tone="muted" style={{ flex: 1.1, fontSize: 14 }}>
                  {r.label}
                </Copy>
                {p.quotes.map((q) => (
                  <Copy
                    key={q.id}
                    tone={r.missing?.(q) ? "rust" : undefined}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: r.label === "Price" ? fonts.bold : fonts.medium,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {r.value(q)}
                  </Copy>
                ))}
              </View>
            ))}
          </Card>
          {p.quotes.some((q) => !q.cleanup) && (
            <Note warning>
              Not every quote lists cleanup. Ask before you choose, so it isn’t
              an extra charge later.
            </Note>
          )}
          {p.quote && (
            <Card>
              <View style={{ gap: 4 }}>
                <Eyebrow>Accepted quote</Eyebrow>
                <Heading small>{p.quote.company}</Heading>
              </View>
              {p.quote.items.map((i) => (
                <LineItem key={i.label} label={i.label} value={money(i.cents)} />
              ))}
              <Divider />
              <LineItem label="Quote total" value={money(p.quote.cents)} strong />
            </Card>
          )}
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
