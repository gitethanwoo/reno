import { Tabs, router } from "expo-router";
import { Icon, IconName } from "@/components/icon";
import { IconButton, Wordmark } from "@/components/ui";
import { colors, fonts } from "@/components/theme";
import { useStore } from "@/state/store";
import { waitingOn } from "@/features/waiting";
import { Text, View } from "react-native";

export default function TabLayout() {
  const { state } = useStore();
  const waiting = waitingOn(state).length;
  const tabs: { name: string; title: string; icon: IconName }[] = [
    { name: "index", title: "Home", icon: "home" },
    { name: "projects", title: "Projects", icon: "projects" },
    { name: "guides", title: "Guides", icon: "book" },
    { name: "account", title: "Account", icon: "user" },
  ];
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTitle: () => <Wordmark />,
        headerTitleAlign: "left",
        headerRight: () => (
          <View>
            <IconButton
              name="bell"
              label={
                waiting
                  ? `Notifications, ${waiting} waiting on you`
                  : "Notifications"
              }
              onPress={() => router.push("/notifications")}
            />
            {waiting > 0 && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 5,
                  backgroundColor: colors.rust,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontFamily: fonts.bold,
                    fontSize: 11,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {waiting}
                </Text>
              </View>
            )}
          </View>
        ),
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title:
              t.name === "index" && state.role === "contractor"
                ? "Jobs"
                : t.title,
            tabBarIcon: ({ color }) => (
              <Icon name={t.icon} color={color} size={23} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
