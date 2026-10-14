import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Photo } from "@/domain/model";
import { uid, useStore } from "@/state/store";
import { ErrorNote, useTask } from "./ui";
import { Icon } from "./icon";
import { colors, fonts } from "./theme";

/**
 * The last row of the punch list: type an item, press Return, and the field
 * stays focused for the next one (like Reminders). Return on an empty field
 * puts the keyboard away. The camera attaches one photo to the next item.
 */
export function PunchComposer({
  projectId,
  first,
}: {
  projectId: string;
  /** No items yet, so the row stands alone instead of closing a list. */
  first: boolean;
}) {
  const { commit, addPhotos } = useStore();
  const task = useTask();
  const photoTask = useTask();
  const input = useRef<TextInput>(null);
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState<Photo>();
  const submit = () => {
    const value = title.trim();
    if (!value) {
      input.current?.blur();
      return;
    }
    void task.run(async () => {
      // Clear right away so the next item can be typed while this one saves.
      setTitle("");
      setPhoto(undefined);
      try {
        await commit({
          type: "punch-add",
          projectId,
          id: uid(),
          title: value,
          note: "",
          photo,
          at: new Date().toISOString(),
        });
      } catch (e) {
        setTitle((typed) => typed || value);
        setPhoto((picked) => picked ?? photo);
        throw e;
      }
    });
  };
  const pick = () =>
    photoTask.run(async () => {
      const [picked] = await addPhotos(1);
      if (picked) setPhoto(picked);
      input.current?.focus();
    });
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
        {photo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            hitSlop={6}
            onPress={() => setPhoto(undefined)}
          >
            <Image
              source={photo.uri}
              contentFit="cover"
              style={{ width: 40, height: 40, borderRadius: 8 }}
            />
            <View
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.ink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="close" size={12} color={colors.white} />
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach a photo to the next item"
            accessibilityState={{ busy: photoTask.busy }}
            disabled={photoTask.busy}
            hitSlop={6}
            onPress={pick}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? colors.sage : "transparent",
            })}
          >
            {photoTask.busy ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Icon name="camera" size={21} color={colors.muted} />
            )}
          </Pressable>
        )}
      </View>
      <ErrorNote error={task.error ?? photoTask.error} />
    </View>
  );
}
