import * as Haptics from "expo-haptics";
import { router } from "expo-router";

/** After a decision: confirm with a success haptic and return to the project. */
export function finish(projectId: string) {
  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => {});
  backToProject(projectId);
}

/** Pop back instead of pushing a second copy of the project screen. */
export function backToProject(projectId: string) {
  if (router.canGoBack()) router.back();
  else router.replace({ pathname: "/project/[id]", params: { id: projectId } });
}
