import { useRef } from "react";
import { ActionSheetIOS, Alert } from "react-native";
import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { colors } from "@/components/theme";
import { confirm } from "./confirm";

/**
 * Asks before a swipe-down, Cancel or Back throws away typed input
 * (Mail and Calendar do the same). Call the returned function right before
 * navigating away after a successful save.
 *
 * Pass `saveDraft` to offer "Save Draft" next to "Discard", like Mail. It
 * receives `leave`, to call once the draft is saved. Web has no three-way
 * prompt, so there it asks only whether to discard.
 */
export function useDiscardGuard(
  dirty: boolean,
  saveDraft?: (leave: () => void) => void,
) {
  const navigation = useNavigation();
  const saved = useRef(false);
  usePreventRemove(dirty, ({ data }) => {
    const leave = () => navigation.dispatch(data.action);
    if (saved.current) {
      leave();
      return;
    }
    if (saveDraft && process.env.EXPO_OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Save Draft", "Discard Changes", "Keep Editing"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          tintColor: colors.ink,
        },
        (index) => {
          if (index === 0) saveDraft(leave);
          if (index === 1) leave();
        },
      );
      return;
    }
    if (saveDraft && process.env.EXPO_OS === "android") {
      Alert.alert(
        "Save this draft?",
        "It’ll be here next time you start a new project.",
        [
          { text: "Keep editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: leave },
          { text: "Save draft", onPress: () => saveDraft(leave) },
        ],
      );
      return;
    }
    confirm({
      title: "Discard this draft?",
      message: "What you’ve entered here won’t be saved.",
      action: "Discard",
      destructive: true,
      onConfirm: leave,
    });
  });
  return () => {
    saved.current = true;
  };
}
