import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Photo } from "@/domain/model";
import { uid, useStore } from "@/state/store";
import { ErrorNote, useTask } from "./ui";
import { Icon } from "./icon";
import { colors, fonts } from "./theme";

/**
 * The bottom of the project thread, like Messages: write, attach one photo,
 * send. The post lands in the thread above and the field clears for the next.
 * `initial` prefills the field when another screen sends someone here to ask.
 */
export function ThreadComposer({
  projectId,
  initial,
  autoFocus,
  focusRequest,
  onSent,
}: {
  projectId: string;
  initial?: string;
  autoFocus?: boolean;
  /** Focuses the field each time it goes up (the "+" menu's "Post an update"). */
  focusRequest?: number;
  onSent: () => void;
}) {
  const { commit, addPhotos } = useStore();
  const task = useTask();
  const photoTask = useTask();
  const [text, setText] = useState(initial ?? "");
  const [photo, setPhoto] = useState<Photo>();
  // A new question from another screen replaces the draft.
  const input = useRef<TextInput>(null);
  // Keyboard focus lives outside React.
  useEffect(() => {
    if (focusRequest) input.current?.focus();
  }, [focusRequest]);
  const [prefill, setPrefill] = useState(initial);
  if (initial !== prefill) {
    setPrefill(initial);
    if (initial) setText(initial);
  }
  const ready = !!text.trim() || !!photo;
  const send = () => {
    if (!ready || task.busy) return;
    const value = text;
    const attached = photo;
    void task.run(async () => {
      // Clear right away so the next message can be typed while this one saves.
      setText("");
      setPhoto(undefined);
      try {
        await commit({
          type: "update",
          projectId,
          id: uid(),
          text: value,
          photo: attached,
          at: new Date().toISOString(),
        });
      } catch (e) {
        setText((typed) => typed || value);
        setPhoto((picked) => picked ?? attached);
        throw e;
      }
      onSent();
    });
  };
  const pick = () =>
    photoTask.run(async () => {
      const [picked] = await addPhotos(1);
      if (picked) setPhoto(picked);
    });
  return (
    <View style={{ gap: 10 }}>
      <ErrorNote error={task.error ?? photoTask.error} />
      {photo && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          onPress={() => setPhoto(undefined)}
          style={{ alignSelf: "flex-start" }}
        >
          <Image
            source={photo.uri}
            contentFit="cover"
            style={{ width: 72, height: 72, borderRadius: 10 }}
          />
          <View
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={12} color={colors.white} />
          </View>
        </Pressable>
      )}
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            photo ? "Choose a different photo" : "Add a photo"
          }
          accessibilityState={{ busy: photoTask.busy }}
          disabled={photoTask.busy}
          hitSlop={6}
          onPress={pick}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.sage : "transparent",
          })}
        >
          {photoTask.busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Icon name="camera" size={22} color={colors.muted} />
          )}
        </Pressable>
        <TextInput
          ref={input}
          testID="thread-composer"
          accessibilityLabel="Message"
          placeholder="Write an update"
          placeholderTextColor="#8B928B"
          value={text}
          onChangeText={setText}
          autoFocus={autoFocus}
          // Return starts a new line; the Send button sends.
          multiline
          submitBehavior="newline"
          returnKeyType="default"
          // A browser textarea opens two rows tall; native grows with the text.
          numberOfLines={process.env.EXPO_OS === "web" ? 1 : undefined}
          maxLength={2000}
          autoCapitalize="sentences"
          selectionColor={colors.ink}
          cursorColor={colors.ink}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 132,
            paddingHorizontal: 16,
            paddingTop: 11,
            paddingBottom: 11,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.white,
            fontFamily: fonts.regular,
            fontSize: 16,
            color: colors.ink,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !ready, busy: task.busy }}
          disabled={!ready}
          hitSlop={6}
          onPress={send}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ready ? colors.ink : colors.line,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name="arrow" size={20} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
