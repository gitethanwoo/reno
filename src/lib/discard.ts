import { useRef } from "react";
import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { confirm } from "./confirm";

/**
 * Asks before a swipe-down, Cancel or Back throws away typed input
 * (Mail and Calendar do the same). Call the returned function right before
 * navigating away after a successful save.
 */
export function useDiscardGuard(dirty: boolean) {
  const navigation = useNavigation();
  const saved = useRef(false);
  usePreventRemove(dirty, ({ data }) => {
    if (saved.current) {
      navigation.dispatch(data.action);
      return;
    }
    confirm({
      title: "Discard this draft?",
      message: "What you’ve entered here won’t be saved.",
      action: "Discard",
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    });
  });
  return () => {
    saved.current = true;
  };
}
