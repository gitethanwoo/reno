import { router } from "expo-router";
import { Image } from "expo-image";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { kitchen } from "@/components/project-card";
import {
  Button,
  Copy,
  ErrorNote,
  Heading,
  Screen,
  Wordmark,
  useTask,
} from "@/components/ui";
import { useStore } from "@/state/store";
export default function Welcome() {
  const { commit } = useStore();
  const task = useTask();
  const inset = useSafeAreaInsets();
  return (
    <Screen padded={false}>
      <View style={{ paddingTop: inset.top + 10, paddingHorizontal: 24 }}>
        <Wordmark />
      </View>
      <Image
        source={kitchen}
        style={{ width: "100%", height: 290 }}
        contentFit="cover"
        accessibilityLabel="A sunlit kitchen with sage ceramic tile"
      />
      <View style={{ paddingHorizontal: 24, gap: 20 }}>
        <Heading>Your home.{"\n"}Your say.</Heading>
        <Copy>Know the cost. Keep the record. Own the outcome.</Copy>
        <Button
          title="Open my notebook"
          icon="arrow"
          busy={task.busy}
          onPress={() =>
            task.run(async () => {
              await commit({ type: "welcome" });
              router.replace("/");
            })
          }
        />
        <ErrorNote error={task.error} />
        <Copy tone="muted" style={{ fontSize: 12, textAlign: "center" }}>
          Early preview · Includes one sample project. Keep the whole job in one
          place.
        </Copy>
      </View>
    </Screen>
  );
}
