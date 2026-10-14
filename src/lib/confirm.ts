import { Alert, Platform } from "react-native";

/** The system confirmation alert; React Native Web has no Alert, so the browser's confirm is used there. */
export function confirm(options: {
  title: string;
  message: string;
  action: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  if (Platform.OS === "web") {
    if (window.confirm(options.title + "\n\n" + options.message))
      options.onConfirm();
    return;
  }
  Alert.alert(options.title, options.message, [
    { text: "Cancel", style: "cancel" },
    {
      text: options.action,
      style: options.destructive ? "destructive" : "default",
      onPress: options.onConfirm,
    },
  ]);
}
