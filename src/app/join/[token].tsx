import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSessionMode } from "@/state/session";
import { expiresIn } from "@/lib/invite";
import {
  Button,
  Card,
  Copy,
  ErrorNote,
  Eyebrow,
  Note,
  Screen,
  Title,
  useTask,
} from "@/components/ui";

export default function Join() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { preview } = useSessionMode();
  // Queries can't read the clock, so expiry is checked here against load time.
  const [now] = useState(() => Date.now());
  const live = useQuery(
    api.invites.preview,
    !preview && token ? { token } : "skip",
  );
  // Once Join is tapped the live preview flips to "used"; keep showing the
  // invite until navigation finishes.
  const [joining, setJoining] = useState<typeof live>(undefined);
  const found = joining ?? live;
  const accept = useMutation(api.invites.accept);
  const task = useTask();
  const expiry =
    found?.status === "ok" ? expiresIn(found.expiresAt, now) : null;
  const open = found?.status === "ok" && expiry !== null;
  const home = () => router.replace("/");

  if (preview)
    return (
      <Screen footer={<Button title="Go home" onPress={home} />}>
        <Title sub="This link opens a project a homeowner shared with you.">
          Join a project
        </Title>
        <Note>
          Sign in on your iPhone to join a project. The sample notebook stays on
          this device.
        </Note>
      </Screen>
    );
  if (found === undefined)
    return (
      <Screen>
        <Title>Join a project</Title>
        <Copy tone="muted">Checking your invite…</Copy>
      </Screen>
    );
  if (!open)
    return (
      <Screen
        footer={<Button title="Go home" variant="secondary" onPress={home} />}
      >
        <Title>Join a project</Title>
        <Note warning>
          {found.status === "ok"
            ? "This link has expired. Ask " +
              found.homeowner +
              " to send a new one."
            : found.message}
        </Note>
      </Screen>
    );
  return (
    <Screen
      footer={
        <Button
          title="Join as contractor"
          busy={task.busy}
          onPress={() =>
            task.run(async () => {
              setJoining(found);
              const { projectId } = await accept({ token }).catch(
                (error: unknown) => {
                  setJoining(undefined);
                  throw error;
                },
              );
              router.replace({
                pathname: "/project/[id]",
                params: { id: projectId },
              });
            })
          }
        />
      }
    >
      <Title sub={"Invited by " + found.homeowner}>
        {"Join " + found.title + "?"}
      </Title>
      <Card>
        <Eyebrow>{found.type + " · " + found.zip}</Eyebrow>
        <Copy>
          You’ll see the scope, photos and record, and can send your quote. This
          link works once and expires {expiry}.
        </Copy>
      </Card>
      <ErrorNote error={task.error} />
    </Screen>
  );
}
