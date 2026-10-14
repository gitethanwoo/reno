import { useState } from "react";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useStore, uid } from "@/state/store";
import { Draft, validateDraft } from "@/domain/model";
import {
  Button,
  Card,
  Copy,
  ErrorNote,
  Eyebrow,
  Field,
  Heading,
  IconButton,
  Note,
  Screen,
  Segments,
  useTask,
} from "@/components/ui";
import { colors, fonts } from "@/components/theme";
import { Icon } from "@/components/icon";
export default function NewProject() {
  const { state, commit, addPhoto } = useStore();
  const [draft, setDraft] = useState<Draft>(state.draft);
  const [step, setStep] = useState(0);
  const task = useTask();
  const [id] = useState(uid);
  const update = (field: keyof Draft, value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));
  const save = () => commit({ type: "save-draft", draft });
  const next = () =>
    task.run(async () => {
      if (step === 1) validateDraft(draft);
      await save();
      setStep((n) => n + 1);
    });
  return (
    <Screen
      keyboard
      footer={
        <View style={{ gap: 8 }}>
          <Button
            title={step === 3 ? "Create project" : "Continue"}
            icon="arrow"
            busy={task.busy}
            onPress={
              step === 3
                ? () =>
                    task.run(async () => {
                      await save();
                      await commit({
                        type: "create-project",
                        id,
                        at: new Date().toISOString(),
                      });
                      router.replace({
                        pathname: "/project/[id]",
                        params: { id },
                      });
                    })
                : next
            }
          />
          <Button
            title="Save draft & close"
            variant="quiet"
            disabled={task.busy}
            onPress={() =>
              task.run(async () => {
                await save();
                router.back();
              })
            }
          />
        </View>
      }
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow>
          {step + 1} of 4 ·{" "}
          {["The job", "The details", "The look", "Your work order"][step]}
        </Eyebrow>
        {step > 0 && (
          <IconButton
            name="back"
            label="Previous step"
            onPress={() => setStep((n) => n - 1)}
          />
        )}
      </View>
      <View style={{ height: 4, backgroundColor: colors.line }}>
        <View
          style={{
            height: 4,
            width: `${(step + 1) * 25}%`,
            backgroundColor: colors.rust,
          }}
        />
      </View>
      {step === 0 && (
        <>
          <Heading>What’s on{"\n"}your list?</Heading>
          <Copy tone="muted">Start with one job. We’ll keep it clear.</Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {[
              "Kitchen",
              "Bathroom",
              "Painting",
              "Flooring",
              "Roofing",
              "Other",
            ].map((type) => (
              <Pressable
                key={type}
                accessibilityRole="radio"
                accessibilityState={{ checked: draft.type === type }}
                onPress={() => update("type", type)}
                style={{
                  width: "47%",
                  minHeight: 110,
                  padding: 20,
                  gap: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: draft.type === type ? colors.ink : colors.line,
                  backgroundColor:
                    draft.type === type ? colors.sage : colors.white,
                }}
              >
                <Icon name={type === "Roofing" ? "home" : "tools"} />
                <Copy style={{ fontFamily: fonts.medium }}>{type}</Copy>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {step === 1 && (
        <>
          <Heading>Tell us what{"\n"}you have in mind.</Heading>
          <Field
            label="Project name"
            value={draft.title}
            onChangeText={(v) => update("title", v)}
            placeholder="e.g. Kitchen backsplash"
            maxLength={80}
          />
          <Field
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
                keyboardType="decimal-pad"
                value={draft.area}
                onChangeText={(v) => update("area", v)}
                placeholder="35"
                maxLength={8}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Home ZIP code"
                keyboardType="number-pad"
                value={draft.zip}
                onChangeText={(v) => update("zip", v)}
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
          <Heading>Show us{"\n"}the space.</Heading>
          <Copy tone="muted">
            A few photos make the scope clearer. Add your room or a look you
            love.
          </Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {draft.photos.map((photo) => (
              <View key={photo.id} style={{ width: "47%", gap: 4 }}>
                <Image
                  source={photo.uri}
                  style={{ width: "100%", height: 150, borderRadius: 12 }}
                  contentFit="cover"
                  accessibilityLabel={photo.name}
                />
                <Button
                  title="Remove photo"
                  variant="quiet"
                  onPress={() =>
                    setDraft((d) => ({
                      ...d,
                      photos: d.photos.filter((p) => p.id !== photo.id),
                    }))
                  }
                />
              </View>
            ))}
          </View>
          <Button
            title="Add a photo"
            icon="camera"
            variant="secondary"
            disabled={draft.photos.length >= 8}
            onPress={() =>
              task.run(async () => {
                const photo = await addPhoto();
                if (photo)
                  setDraft((d) => ({ ...d, photos: [...d.photos, photo] }));
              })
            }
          />
          <Copy tone="muted" style={{ fontSize: 13 }}>
            Up to 8 photos. You can also add them later.
          </Copy>
        </>
      )}
      {step === 3 && (
        <>
          <Heading>A clear start.</Heading>
          <Copy tone="muted">
            Here’s your first work order. You can keep adding to it as your
            plans take shape.
          </Copy>
          <Card>
            <Eyebrow>{draft.type}</Eyebrow>
            <Heading small>{draft.title}</Heading>
            <Copy>{draft.scope}</Copy>
            <Copy tone="muted">
              {draft.zip} · {draft.timing}
              {draft.area ? " · " + draft.area + " sq ft" : ""}
            </Copy>
            <Copy tone="muted">{draft.photos.length} photos attached</Copy>
          </Card>
          <Note>
            This saves your project. It does not request quotes or share your
            details with contractors yet.
          </Note>
        </>
      )}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
