import { Tabs, router } from "expo-router";
import { Icon, IconName } from "@/components/icon";
import { IconButton, Wordmark } from "@/components/ui";
import { colors, fonts } from "@/components/theme";
import { useStore } from "@/state/store";

export default function TabLayout() {
  const { state } = useStore();
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
          <IconButton
            name="bell"
            label="Notifications"
            onPress={() => router.push("/notifications")}
          />
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
