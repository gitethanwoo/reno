import { useLocalSearchParams } from "expo-router";
import { useStore } from "@/state/store";
import { roleIn } from "@/domain/model";
export function useProject() {
  const params = useLocalSearchParams<{
    id: string;
    itemId?: string;
    changeId?: string;
    tab?: string;
    text?: string;
  }>();
  const store = useStore();
  const project = store.state.projects.find((p) => p.id === params.id);
  return {
    ...store,
    params,
    project,
    /** The viewer's role on this project; falls back to the preview switch. */
    role: project ? roleIn(project, store.state) : store.state.role,
  };
}
