import { useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSessionMode } from "@/state/session";

// Push needs a real phone; the simulator and the web preview can't get a token.
const supported = Platform.OS !== "web" && Device.isDevice;

// Show the other person's news as a banner even while Reno is open.
if (supported)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

/**
 * The Expo push token, asking for permission only when `ask` is true and
 * iOS still allows asking. Null when push isn't available or was declined.
 */
async function pushToken(ask: boolean): Promise<string | null> {
  if (!supported) return null;
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("default", {
      name: "Project updates",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && ask && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const projectId: unknown =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (typeof projectId !== "string") return null;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

/**
 * Returns `ask`, which shows the system prompt (once) and registers this
 * device. Call it right after a moment where hearing back matters: sharing
 * an invite, joining a project, sending a quote. Never throws, so it can't
 * break the action that preceded it.
 */
export function useAskForPush() {
  const { preview } = useSessionMode();
  const register = useMutation(api.push.register);
  return async function ask() {
    if (preview) return;
    try {
      const token = await pushToken(true);
      if (token) await register({ token });
    } catch (error) {
      console.warn("Push registration failed", error);
    }
  };
}

/** Stops this device getting another account's news. Call before signing out. */
export function useForgetPush() {
  const unregister = useMutation(api.push.unregister);
  return async function forget() {
    try {
      const token = await pushToken(false);
      if (token) await unregister({ token });
    } catch (error) {
      console.warn("Push unregistration failed", error);
    }
  };
}

/** Only paths into a project are followed from a notification. */
const projectPath = /^\/project\/[^/?#]+(\/[a-z]+)?(\?[^#]*)?$/;

/**
 * Keeps push working without prompting: re-registers the device when
 * permission was already granted (tokens can change), and opens the screen a
 * tapped notification points to, from a cold start or while running. Render
 * once, inside the signed-in navigator.
 */
export function PushObserver() {
  const { preview } = useSessionMode();
  const register = useMutation(api.push.register);
  useEffect(() => {
    if (!supported || preview) return;
    pushToken(false)
      .then((token) => (token ? register({ token }) : null))
      .catch((error: unknown) =>
        console.warn("Push registration failed", error),
      );
  }, [preview, register]);
  useEffect(() => {
    if (!supported) return;
    function open(response: Notifications.NotificationResponse) {
      // Handle each tap once, even if this observer remounts later.
      Notifications.clearLastNotificationResponse();
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
        return;
      const url: unknown = response.notification.request.content.data?.url;
      // The server builds these paths from routes in src/app/project/[id].
      if (typeof url === "string" && projectPath.test(url))
        router.push(url as Href);
    }
    // A tap that launched the app arrived before this listener existed.
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);
  return null;
}
