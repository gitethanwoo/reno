import { SessionProvider, useSessionMode } from "@/state/session";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from "@expo-google-fonts/dm-serif-display";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StoreProvider, useStore } from "@/state/store";
import { Button, Copy } from "@/components/ui";
import { NameStep } from "@/components/name-step";
import { colors, fonts } from "@/components/theme";
import { PushObserver } from "@/lib/push";

export { ErrorBoundary } from "expo-router";
// Modal forms get Cancel on the left, like Mail and Calendar. Leaving with
// unsaved input asks first (see lib/discard.ts).
const modal = (title: string) => ({
  title,
  presentation: "modal" as const,
  headerLeft: () => (
    <Pressable
      accessibilityRole="button"
      hitSlop={12}
      onPress={() => router.back()}
    >
      <Text
        style={{ fontFamily: fonts.regular, fontSize: 17, color: colors.ink }}
      >
        Cancel
      </Text>
    </Pressable>
  ),
});
function Routes() {
  const { state, ready, loadError, reload } = useStore();
  const { preview } = useSessionMode();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 30,
          gap: 24,
          backgroundColor: colors.paper,
        }}
      >
        {loadError ? (
          <>
            <Copy>{loadError}</Copy>
            <Button title="Try again" onPress={reload} />
          </>
        ) : (
          <ActivityIndicator color={colors.ink} />
        )}
      </View>
    );
  return (
    <>
      <PushObserver />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          contentStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.medium, fontSize: 16 },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="new-project" options={modal("New project")} />
        <Stack.Screen
          name="project/[id]/index"
          options={{ title: "Your project" }}
        />
        <Stack.Screen
          name="project/[id]/change"
          options={{ title: "Change request" }}
        />
        <Stack.Screen
          name="project/[id]/payment"
          options={modal("Log a payment")}
        />
        <Stack.Screen
          name="project/[id]/punch"
          options={{ title: "Punch list" }}
        />
        <Stack.Screen
          name="project/[id]/quotes"
          options={{ title: "Compare quotes" }}
        />
        <Stack.Screen
          name="project/[id]/terms"
          options={{ title: "Review the terms" }}
        />
        <Stack.Screen
          name="project/[id]/propose"
          options={modal("Propose a change")}
        />
        <Stack.Screen
          name="project/[id]/complete"
          options={{ title: "Finish project" }}
        />
        <Stack.Screen
          name="project/[id]/invite"
          options={{ title: "Invite contractor" }}
        />
        <Stack.Screen
          name="project/[id]/quote"
          options={modal("Send a quote")}
        />
        <Stack.Screen
          name="join/[token]"
          options={{ title: "Join a project" }}
        />
        <Stack.Screen
          name="guides/[id]"
          options={{ title: "Reno field guide" }}
        />
        <Stack.Screen
          name="notifications"
          options={{ title: "Your updates" }}
        />
      </Stack>
      {!preview && !state.name && <NameStep />}
    </>
  );
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });
  if (!loaded && !error)
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  return (
    <PaperProvider
      theme={{
        ...MD3LightTheme,
        roundness: 3,
        colors: {
          ...MD3LightTheme.colors,
          primary: colors.ink,
          secondaryContainer: colors.lime,
          onSecondaryContainer: colors.ink,
          background: colors.paper,
          surface: colors.white,
          onSurface: colors.ink,
          outline: colors.line,
        },
      }}
    >
      <SessionProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <Routes />
        </StoreProvider>
      </SessionProvider>
    </PaperProvider>
  );
}
