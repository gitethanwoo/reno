import { router } from "expo-router";
import { Button, Empty, Screen } from "@/components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Empty
        title="This page wandered off."
        text="Your projects are right where you left them."
        action={
          <Button title="Back to home" onPress={() => router.replace("/")} />
        }
      />
    </Screen>
  );
}
