import { useLocalSearchParams } from "expo-router";
import { useStore } from "@/state/store";
export function useProject() {
  const params = useLocalSearchParams<{
    id: string;
    itemId?: string;
    changeId?: string;
    tab?: string;
    text?: string;
  }>();
  const store = useStore();
  return {
    ...store,
    params,
    project: store.state.projects.find((p) => p.id === params.id),
  };
}
