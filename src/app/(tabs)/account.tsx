import { authClient } from "@/lib/auth-client";
import { useSessionMode } from "@/state/session";
import { useState } from "react";
import { useStore } from "@/state/store";
import { Role } from "@/domain/model";
import { View } from "react-native";
import {
  Button,
  Card,
  Copy,
  ErrorNote,
  Field,
  Screen,
  Segments,
  Title,
  useTask,
} from "@/components/ui";
import { fonts } from "@/components/theme";
export default function Account() {
  const { state, commit } = useStore();
  const { preview, exitPreview } = useSessionMode();
  const [name, setName] = useState(state.name);
  const [role, setRole] = useState<Role>(state.role);
  const task = useTask();
  const [saved, setSaved] = useState(false);
  return (
    <Screen keyboard>
      <Title>Account</Title>
      <Card>
        <Field
          label="Your first name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setSaved(false);
          }}
          maxLength={50}
        />
        <View style={{ gap: 10 }}>
          <Copy style={{ fontFamily: fonts.medium }}>View the app as</Copy>
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
          <Copy tone="muted" style={{ fontSize: 13, lineHeight: 19 }}>
            Switches your own notebook between the two sides of a job. It does
            not give access to anyone else’s projects.
          </Copy>
        </View>
        <Button
          title={saved ? "Saved" : "Save changes"}
          icon={saved ? "check" : undefined}
          busy={task.busy}
          onPress={() =>
            task.run(async () => {
              await commit({ type: "profile", name, role });
              setSaved(true);
            })
          }
        />
      </Card>
      <ErrorNote error={task.error} />
      <Card>
        <Copy tone="muted" style={{ fontSize: 14 }}>
          {preview
            ? "You’re in the sample notebook. Changes stay on this device."
            : "Your notebook syncs privately to your Reno account."}
        </Copy>
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
      </Card>
      <Copy tone="muted" style={{ fontSize: 13, textAlign: "center" }}>
        Reno · Early access 0.1
      </Copy>
    </Screen>
  );
}
