import React, { createContext, use, useEffect, useRef, useState } from "react";
import { AppState, appStateSchema, Photo } from "@/domain/model";
import { initialState } from "@/domain/seed";
import { Action, reduce } from "@/domain/reducer";
import { storage } from "./storage";
import { useMutation, useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSessionMode } from "./session";
import { pickPhotos, photoUpload } from "@/lib/photos";

const KEY = "reno-project-notebook-v1";
type Store = {
  state: AppState;
  ready: boolean;
  loadError: string | null;
  commit: (action: Action) => Promise<void>;
  reload: () => void;
  /** Pick up to `max` photos (camera or library), uploaded when signed in. */
  addPhotos: (max: number) => Promise<Photo[]>;
};
const Context = createContext<Store | null>(null);
function LocalStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let live = true;
    storage
      .get(KEY)
      .then((value) => {
        const next = value
          ? appStateSchema.parse(JSON.parse(value))
          : initialState();
        if (live) {
          stateRef.current = next;
          setState(next);
          setReady(true);
        }
      })
      .catch(() => {
        if (live)
          setLoadError(
            "Your saved notebook could not be opened. Your existing data has not been replaced.",
          );
      });
    return () => {
      live = false;
    };
  }, [attempt]);
  function commit(action: Action) {
    const pending = queue.current.then(async () => {
      if (!ready) throw new Error("Your notebook is still opening.");
      const next = appStateSchema.parse(reduce(stateRef.current, action));
      await storage.set(KEY, JSON.stringify(next));
      stateRef.current = next;
      setState(next);
    });
    queue.current = pending.catch(() => {});
    return pending;
  }
  return (
    <Context
      value={{
        state,
        ready,
        loadError,
        commit,
        reload: () => {
          setLoadError(null);
          setReady(false);
          setAttempt((n) => n + 1);
        },
        addPhotos: pickPhotos,
      }}
    >
      {children}
    </Context>
  );
}
export function useStore() {
  const store = use(Context);
  if (!store) throw new Error("StoreProvider is missing.");
  return store;
}
export { uid } from "@/lib/id";

function CloudStoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const result = useQuery(api.notebook.get, isAuthenticated ? {} : "skip");
  const initialize = useMutation(api.notebook.initialize);
  const mutate = useMutation(api.notebook.commit);
  const upload = useAction(api.files.upload);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (result === null) {
      void initialize({}).catch((e) =>
        setLoadError(
          e instanceof Error ? e.message : "Your notebook could not be opened.",
        ),
      );
    }
  }, [result, initialize, attempt]);
  async function addPhotos(max: number) {
    const photos = await pickPhotos(max);
    return Promise.all(
      photos.map(async (photo) => upload(await photoUpload(photo))),
    );
  }
  return (
    <Context
      value={{
        state: result ?? initialState(),
        ready: !!result,
        loadError,
        commit: async (action) => {
          await mutate({ action });
        },
        reload: () => {
          setLoadError(null);
          setAttempt((n) => n + 1);
        },
        addPhotos,
      }}
    >
      {children}
    </Context>
  );
}
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { preview } = useSessionMode();
  return preview ? (
    <LocalStoreProvider>{children}</LocalStoreProvider>
  ) : (
    <CloudStoreProvider>{children}</CloudStoreProvider>
  );
}
