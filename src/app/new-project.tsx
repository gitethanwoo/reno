import { useRef, useState } from "react";
import { useDiscardGuard } from "@/lib/discard";
import { Stack, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useStore, uid } from "@/state/store";
import { Draft, type Photo, validateDraft } from "@/domain/model";
import {
  Button,
  Card,
  Copy,
  Eyebrow,
  Field,
  type FieldHandle,
  Heading,
  Note,
  Screen,
  Segments,
  Title,
  plural,
  useTask,
} from "@/components/ui";
import { colors, fonts } from "@/components/theme";
import { Icon } from "@/components/icon";
import { Uploading } from "@/components/photo-gallery";
const MAX_DRAFT_PHOTOS = 8;
export default function NewProject() {
  const { state, commit, addPhotos } = useStore();
  const [draft, setDraft] = useState<Draft>(state.draft);
  const [step, setStep] = useState(0);
  const task = useTask();
  const keyboardUp = useKeyboardState((k) => k.isVisible);
  const [pending, setPending] = useState<Photo[]>([]);
  const [id] = useState(uid);
  const scopeField = useRef<FieldHandle>(null);
  const zipField = useRef<FieldHandle>(null);
  const update = (field: keyof Draft, value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));
  const save = () => commit({ type: "save-draft", draft });
  const [initial] = useState(() => JSON.stringify(state.draft));
  const allowLeave = useDiscardGuard(
    JSON.stringify(draft) !== initial,
    (leave) =>
      task.run(async () => {
        await save();
        leave();
      }),
  );
  return (
    <Screen
      error={task.error}
      footer={
        step > 0 && (
          <View style={{ gap: 8 }}>
            <Button
              title={step === 2 ? "Create project" : "Continue"}
              icon="arrow"
              busy={task.busy}
              onPress={
                step === 2
                  ? () =>
                      task.run(async () => {
                        await save();
                        await commit({
                          type: "create-project",
                          id,
                          at: new Date().toISOString(),
                        });
                        allowLeave();
                        router.replace({
                          pathname: "/project/[id]",
                          params: { id },
                        });
                      })
                  : () =>
                      task.run(async () => {
                        validateDraft(draft);
                        setStep(2);
                      })
              }
            />
            {/* Only the main action rides on the keyboard, so the field
                being typed in keeps the room. Cancel still offers the draft. */}
            {!keyboardUp && (
              <Button
                title="Save draft & close"
                variant="quiet"
                disabled={task.busy}
                onPress={() =>
                  task.run(async () => {
                    await save();
                    allowLeave();
                    router.back();
                  })
                }
              />
            )}
          </View>
        )
      }
    >
      <Stack.Screen
        options={{
          // Replaces the layout's Cancel with Back after the first step.
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => (step > 0 ? setStep((n) => n - 1) : router.back())}
            >
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 17,
                  color: colors.ink,
                }}
              >
                {step > 0 ? "Back" : "Cancel"}
              </Text>
            </Pressable>
          ),
        }}
      />
      <Eyebrow>
        {step + 1} of 3 · {["The job", "The details", "The look"][step]}
      </Eyebrow>
      <View style={{ height: 4, backgroundColor: colors.line }}>
        <View
          style={{
            height: 4,
            width: `${((step + 1) / 3) * 100}%`,
            backgroundColor: colors.rust,
          }}
        />
      </View>
      {step === 0 && (
        <>
          <Title sub="Pick the closest match. You’ll describe the details next.">
            What kind of job?
          </Title>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {(
              [
                ["Kitchen", "kitchen"],
                ["Bathroom", "bath"],
                ["Painting", "paint"],
                ["Flooring", "floor"],
                ["Roofing", "roof"],
                ["Other", "tools"],
              ] as const
            ).map(([type, icon]) => (
              <Pressable
                key={type}
                accessibilityRole="radio"
                accessibilityState={{ checked: draft.type === type }}
                onPress={() => {
                  update("type", type);
                  setStep(1);
                }}
                style={{
                  width: "47%",
                  flexGrow: 1,
                  minHeight: 96,
                  padding: 18,
                  gap: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: draft.type === type ? colors.ink : colors.line,
                  backgroundColor:
                    draft.type === type ? colors.sage : colors.white,
                }}
              >
                <Icon name={icon} />
                <Copy style={{ fontFamily: fonts.medium }}>{type}</Copy>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {step === 1 && (
        <>
          <Title>Describe the work</Title>
          <Field
            label="Project name"
            value={draft.title}
            onChangeText={(v) => update("title", v)}
            placeholder="e.g. Kitchen backsplash"
            maxLength={80}
            // Picking the job type leads straight here; coming Back to
            // edit a name already typed doesn't reopen the keyboard.
            autoFocus={!draft.title}
            onNext={() => scopeField.current?.focus()}
          />
          <Field
            ref={scopeField}
            label="What needs doing?"
            value={draft.scope}
            onChangeText={(v) => update("scope", v)}
            multiline
            placeholder="Materials, changes, and what should stay…"
            maxLength={2000}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Area (sq ft, optional)"
                keyboardType="number-pad"
                value={draft.area}
                onChangeText={(v) => update("area", v.replace(/\D/g, ""))}
                placeholder="35"
                maxLength={6}
                onNext={() => zipField.current?.focus()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                ref={zipField}
                label="Home ZIP code"
                keyboardType="number-pad"
                autoComplete="postal-code"
                textContentType="postalCode"
                value={draft.zip}
                onChangeText={(v) => update("zip", v.replace(/\D/g, ""))}
                maxLength={5}
                placeholder="32084"
              />
            </View>
          </View>
          <Copy>When are you thinking?</Copy>
          <Segments
            value={draft.timing}
            onChange={(v) => update("timing", v)}
            options={["Soon", "Within a month", "Flexible"].map((value) => ({
              label: value,
              value,
            }))}
          />
          {draft.zip.length === 5 &&
            !["32084", "32085", "32086", "32080", "32095"].includes(
              draft.zip,
            ) && (
              <Note>
                We’re starting contractor matching in St. Augustine. You can
                still save and organize your project here.
              </Note>
            )}
        </>
      )}
      {step === 2 && (
        <>
          <Title sub="Photos of the space as it is now, plus any look you love. They make quotes more accurate.">
            Add photos
          </Title>
          {draft.photos.length + pending.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {draft.photos.map((photo, i) => (
                <View key={photo.id} style={{ width: "31.5%", aspectRatio: 1 }}>
                  <Image
                    source={photo.uri}
                    style={{ width: "100%", height: "100%", borderRadius: 10 }}
                    contentFit="cover"
                    accessibilityLabel={photo.name}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={"Remove photo " + (i + 1)}
                    hitSlop={8}
                    onPress={() =>
                      setDraft((d) => ({
                        ...d,
                        photos: d.photos.filter((p) => p.id !== photo.id),
                      }))
                    }
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(23, 51, 47, 0.78)",
                      borderWidth: 1.5,
                      borderColor: colors.white,
                    }}
                  >
                    <Icon name="close" size={14} color={colors.white} />
                  </Pressable>
                </View>
              ))}
              {pending.map((photo) => (
                <View key={photo.id} style={{ width: "31.5%", aspectRatio: 1 }}>
                  <Image
                    source={photo.uri}
                    style={{ width: "100%", height: "100%", borderRadius: 10 }}
                    contentFit="cover"
                    accessibilityLabel={photo.name + ", uploading"}
                  />
                  <Uploading />
                </View>
              ))}
            </View>
          )}
          <Button
            title={draft.photos.length ? "Add more photos" : "Add photos"}
            icon="camera"
            variant="secondary"
            disabled={task.busy || draft.photos.length >= MAX_DRAFT_PHOTOS}
            onPress={() =>
              // Picked photos show at once; Create waits for the upload.
              task.run(async () => {
                try {
                  const photos = await addPhotos(
                    MAX_DRAFT_PHOTOS - draft.photos.length,
                    setPending,
                  );
                  if (photos.length)
                    setDraft((d) => ({
                      ...d,
                      photos: [...d.photos, ...photos].slice(
                        0,
                        MAX_DRAFT_PHOTOS,
                      ),
                    }));
                } finally {
                  setPending([]);
                }
              })
            }
          />
          <Copy tone="muted" style={{ fontSize: 13 }}>
            Up to 8 photos now. You can add more from the project page later.
          </Copy>
          <Card>
            <Eyebrow>Your work order</Eyebrow>
            <Heading small>{draft.title}</Heading>
            <Copy tone="muted">
              {[
                draft.type,
                draft.zip,
                draft.timing,
                draft.area && draft.area + " sq ft",
                plural(draft.photos.length, "photo"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </Copy>
          </Card>
        </>
      )}
    </Screen>
  );
}
