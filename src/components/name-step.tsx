import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/state/store";
import { Button, ErrorNote, Field, Screen, Title, useTask } from "./ui";
import { colors } from "./theme";

/**
 * Asked once, right after sign-up. Drawn over the app instead of replacing it
 * so a deep link (an invite) is still open underneath when this closes.
 */
export function NameStep() {
  const { state, commit } = useStore();
  const [name, setName] = useState("");
  const task = useTask();
  const inset = useSafeAreaInsets();
  const save = () =>
    task.run(() =>
      commit({ type: "profile", name: name.trim(), role: state.role }),
    );
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.paper, paddingTop: inset.top + 24 },
      ]}
    >
      <Screen
        keyboard
        footer={
          <Button
            title="Continue"
            icon="arrow"
            busy={task.busy}
            disabled={!name.trim()}
            onPress={save}
          />
        }
      >
        <Title sub="People on your projects see this name on quotes, changes and updates.">
          What’s your first name?
        </Title>
        <Field
          label="First name"
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="done"
          onSubmitEditing={() => name.trim() && save()}
          maxLength={50}
        />
        <ErrorNote error={task.error} />
      </Screen>
    </View>
  );
}
