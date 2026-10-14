import { authClient } from "@/lib/auth-client";
import { useSessionMode } from "@/state/session";
import { useForgetPush } from "@/lib/push";
import { useState } from "react";
import { useStore } from "@/state/store";
import { Role } from "@/domain/model";
import { Alert, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
  const forgetPush = useForgetPush();
  const [saved, setSaved] = useState(false);
  const removeAccount = useMutation(api.account.remove);
  const deletion = useTask();
  const confirmDelete = () =>
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your notebook and every project you started, for everyone on it. Projects you joined as a contractor stay with the homeowner. This can’t be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () =>
            deletion.run(async () => {
              // Deleting requires a fresh sign-in, so confirm with Face ID first.
              const signIn = await authClient.signIn.passkey();
              if (signIn?.error)
                throw new Error(
                  signIn.error.message ||
                    "Confirm with Face ID to delete your account.",
                );
              await removeAccount({});
              await authClient.signOut();
            }),
        },
      ],
    );
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
            Switches the sample project between the homeowner and contractor
            views. On real projects, your role comes from how you joined.
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
              else {
                await forgetPush();
                await authClient.signOut();
              }
            })
          }
        />
      </Card>
      {!preview && (
        <View style={{ gap: 8 }}>
          <Button
            title="Delete account"
            variant="quiet"
            busy={deletion.busy}
            onPress={confirmDelete}
          />
          <ErrorNote error={deletion.error} />
        </View>
      )}
      <Copy tone="muted" style={{ fontSize: 13, textAlign: "center" }}>
        Reno · Early access 0.1
      </Copy>
    </Screen>
  );
}
