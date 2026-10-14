import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { uid, useStore } from "@/state/store";
import { ErrorNote, useTask } from "./ui";
import { Icon } from "./icon";
import { colors, fonts } from "./theme";

/**
 * The last row of the punch list: type an item, press Return, and the field
 * stays focused for the next one (like Reminders). Return on an empty field
 * puts the keyboard away.
 */
export function PunchComposer({
  projectId,
  first,
}: {
  projectId: string;
  /** No items yet, so the row stands alone instead of closing a list. */
  first: boolean;
}) {
  const { commit } = useStore();
  const task = useTask();
  const input = useRef<TextInput>(null);
  const [title, setTitle] = useState("");
  const submit = () => {
    const value = title.trim();
    if (!value) {
      input.current?.blur();
      return;
    }
    void task.run(async () => {
      // Clear right away so the next item can be typed while this one saves.
      setTitle("");
      try {
        await commit({
          type: "punch-add",
          projectId,
          id: uid(),
          title: value,
          note: "",
          at: new Date().toISOString(),
        });
      } catch (e) {
        setTitle((typed) => typed || value);
        throw e;
      }
    });
  };
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          minHeight: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 8,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: colors.line,
        }}
      >
        <View
          style={{
            height: 42,
            width: 42,
            borderRadius: 12,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.line,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="plus" size={21} color={colors.muted} />
        </View>
        <TextInput
          ref={input}
          testID="punch-composer"
          accessibilityLabel="New punch item"
          placeholder={first ? "Add the first item" : "Add an item"}
          placeholderTextColor="#8B928B"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={submit}
          // Keep the keyboard up for the next item. Native reads
          // submitBehavior; react-native-web only reads blurOnSubmit.
          submitBehavior="submit"
          blurOnSubmit={false}
          returnKeyType="done"
          enterKeyHint="done"
          autoCapitalize="sentences"
          maxLength={100}
          selectionColor={colors.ink}
          cursorColor={colors.ink}
          style={{
            flex: 1,
            minHeight: 44,
            fontFamily: fonts.medium,
            fontSize: 16,
            color: colors.ink,
          }}
        />
      </View>
      <ErrorNote error={task.error} />
    </View>
  );
}
