import { router } from "expo-router";
import { View } from "react-native";
import { useProject } from "@/features/use-project";
import { money, dateLabel } from "@/domain/model";
import {
  Badge,
  Button,
  Card,
  Copy,
  Divider,
  Empty,
  Eyebrow,
  Heading,
  Note,
  Screen,
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
  return (
    <Screen>
      <Heading>Same job.{"\n"}Clearer choices.</Heading>
      <Copy tone="muted">
        {p.title} · {p.quotes.length} quotes
      </Copy>
      {!p.quotes.length ? (
        <Empty
          title="Ready for real conversations."
          text="Your scope is saved. Live contractor matching and quote requests are not connected in this build."
        />
      ) : (
        <>
          <Note>
            These are fictional sample quotes to explore the comparison
            experience.
          </Note>
          <View
            style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}
          >
            {p.quotes.map((q) => (
              <Card
                key={q.id}
                style={{
                  flex: 1,
                  padding: 14,
                  gap: 15,
                  borderColor: p.quote?.id === q.id ? colors.ink : colors.line,
                }}
              >
                <Eyebrow>
                  {q.id === p.quote?.id ? "Chosen quote" : "Alternative"}
                </Eyebrow>
                <Copy style={{ fontFamily: fonts.bold, minHeight: 48 }}>
                  {q.company}
                </Copy>
                <Heading small>{money(q.cents)}</Heading>
                <Divider />
                {[
                  ["Start", dateLabel(q.start)],
                  ["Duration", q.durationDays + " days"],
                  ["Materials", "Included"],
                  ["Cleanup", q.cleanup ? "Included" : "Not specified"],
                  ["Deposit", q.depositPercent + "%"],
                ].map(([title, value]) => (
                  <View key={title} style={{ gap: 5 }}>
                    <Copy tone="muted" style={{ fontSize: 12 }}>
                      {title}
                    </Copy>
                    <Copy style={{ fontFamily: fonts.medium, fontSize: 14 }}>
                      {value}
                    </Copy>
                  </View>
                ))}
              </Card>
            ))}
          </View>
          {p.quote && (
            <Card>
              <Badge>Accepted quote</Badge>
              <Heading small>{p.quote.company}</Heading>
              {p.quote.items.map((i) => (
                <View
                  key={i.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Copy>{i.label}</Copy>
                  <Copy>{money(i.cents)}</Copy>
                </View>
              ))}
            </Card>
          )}
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
        </>
      )}
    </Screen>
  );
}
