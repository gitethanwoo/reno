import { authClient } from "@/lib/auth-client";
import { useSessionMode } from "@/state/session";
import { useState } from "react";
import { useStore } from "@/state/store";
import { Role } from "@/domain/model";
import {
  Button,
  Copy,
  ErrorNote,
  Field,
  Heading,
  Note,
  Screen,
  Segments,
  useTask,
} from "@/components/ui";
export default function Account() {
  const { state, commit } = useStore();
  const { preview, exitPreview } = useSessionMode();
  const [name, setName] = useState(state.name);
  const [role, setRole] = useState<Role>(state.role);
  const task = useTask();
  const [saved, setSaved] = useState(false);
  return (
    <Screen keyboard>
      <Heading>Your notebook.{"\n"}Your way.</Heading>
      <Field
        label="Your first name"
        value={name}
        onChangeText={(v) => {
          setName(v);
          setSaved(false);
        }}
        maxLength={50}
      />
      <Copy>Explore the workspace</Copy>
      <Segments
        value={role}
        onChange={(v) => {
          setRole(v);
          setSaved(false);
        }}
        options={[
          { label: "Homeowner", value: "homeowner" },
          { label: "Contractor", value: "contractor" },
        ]}
      />
      <Note>
        In this preview you can explore both sides of your sample job. Role
        switching does not grant access to anyone else’s projects.
      </Note>
      <Button
        title={saved ? "Changes saved ✓" : "Save preferences"}
        busy={task.busy}
        onPress={() =>
          task.run(async () => {
            await commit({ type: "profile", name, role });
            setSaved(true);
          })
        }
      />
      <ErrorNote error={task.error} />
      <Note>
        {preview
          ? "Sample mode · Changes stay on this device."
          : "Your notebook syncs securely to your Reno account."}
      </Note>
      <Button
        title={preview ? "Exit sample notebook" : "Sign out"}
        variant="secondary"
        onPress={() =>
          task.run(async () => {
            if (preview) exitPreview();
            else await authClient.signOut();
          })
        }
      />
      <Copy tone="muted" style={{ fontSize: 13 }}>
        Reno · Early access build 0.1{"\n"}Your home. Your say.
      </Copy>
    </Screen>
  );
}
