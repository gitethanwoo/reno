import { useState } from "react";
import { router } from "expo-router";
import { useStore } from "@/state/store";
import { guides } from "@/features/guides";
import {
  Card,
  Copy,
  Empty,
  Eyebrow,
  Heading,
  Row,
  Screen,
  Tabs,
  Title,
} from "@/components/ui";
import { colors } from "@/components/theme";
export default function Guides() {
  const { state } = useStore();
  const [tab, setTab] = useState("browse");
  const visible = guides.filter(
    (g) => tab === "browse" || state.savedGuides.includes(g.id),
  );
  return (
    <Screen>
      <Title sub="Short, practical reads for each stage of a job.">Guides</Title>
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { label: "Browse", value: "browse" },
          { label: "My library", value: "saved" },
        ]}
      />
      {visible.map((g, i) => (
        <Card
          key={g.id}
          style={{ backgroundColor: i === 0 ? colors.lime : colors.white }}
        >
          <Eyebrow>Reno field guide · {g.minutes} min</Eyebrow>
          <Heading small>{g.title}</Heading>
          <Copy>{g.subtitle}</Copy>
          <Row
            title="Read the guide"
            icon="book"
            onPress={() =>
              router.push({ pathname: "/guides/[id]", params: { id: g.id } })
            }
          />
        </Card>
      ))}
      {!visible.length && (
        <Empty
          title="Your field notes."
          text="Save a guide while reading it, and it will be waiting here."
        />
      )}
    </Screen>
  );
}
