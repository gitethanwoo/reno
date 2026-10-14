import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { useStore } from "@/state/store";
import { guides } from "@/features/guides";
import {
  Button,
  Copy,
  Empty,
  ErrorNote,
  Eyebrow,
  Heading,
  Screen,
  useTask,
} from "@/components/ui";
export default function Guide() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, commit } = useStore();
  const task = useTask();
  const guide = guides.find((g) => g.id === id);
  if (!guide)
    return (
      <Screen>
        <Empty
          title="Guide not found."
          text="Visit Guides for the latest field notes."
        />
      </Screen>
    );
  return (
    <Screen
      footer={
        <Button
          title={
            state.savedGuides.includes(id)
              ? "Saved to my library ✓"
              : "Save to my library"
          }
          variant="secondary"
          busy={task.busy}
          onPress={() => task.run(() => commit({ type: "save-guide", id }))}
        />
      }
    >
      <Eyebrow>Reno field guide · {guide.minutes} min read</Eyebrow>
      <Heading>{guide.title}</Heading>
      <Copy tone="muted">{guide.subtitle}</Copy>
      {guide.sections.map(([title, copy], i) => (
        <View key={title} style={{ gap: 12, paddingVertical: 10 }}>
          <Eyebrow>{String(i + 1).padStart(2, "0")}</Eyebrow>
          <Heading small>{title}</Heading>
          <Copy>{copy}</Copy>
        </View>
      ))}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
