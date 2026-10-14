import { useState } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useDiscardGuard } from "@/lib/discard";
import { useProject } from "@/features/use-project";
import { Photo } from "@/domain/model";
import { PhotoViewer, type GalleryPhoto } from "@/components/photo-gallery";
import { colors } from "@/components/theme";
import {
  Badge,
  Button,
  Card,
  Copy,
  Empty,
  Eyebrow,
  Field,
  Heading,
  Note,
  Screen,
  useTask,
} from "@/components/ui";
import { Pressable, View } from "react-native";
export default function Punch() {
  const { project: p, params, role, commit, addPhotos } = useProject();
  const task = useTask();
  const item = p?.punch.find((i) => i.id === params.itemId);
  const [note, setNote] = useState("");
  // Null until the homeowner edits, so the field shows the saved detail.
  const [detail, setDetail] = useState<string | null>(null);
  // The contractor's proof, sent with the fix.
  const [fixPhoto, setFixPhoto] = useState<Photo>();
  const [viewing, setViewing] = useState<number | null>(null);
  const edited = !!item && detail !== null && detail.trim() !== item.note;
  const allowLeave = useDiscardGuard(edited || !!note.trim() || !!fixPhoto);
  if (!p)
    return (
      <Screen error={task.error}>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const act = (status: "review" | "open" | "resolved") =>
    task.run(async () => {
      if (!item) return;
      await commit({
        type: "punch-review",
        projectId: p.id,
        id: item.id,
        status,
        note,
        photo: status === "review" ? fixPhoto : undefined,
        at: new Date().toISOString(),
      });
      allowLeave();
      router.back();
    });
  if (!item)
    return (
      <Screen error={task.error}>
        <Empty
          title="This item could not be found."
          text="Return to the project’s punch list."
        />
      </Screen>
    );
  const homeowner = role === "homeowner",
    closed = p.status === "completed";
  // Who can act on the item right now, and how.
  const canReview = homeowner && item.status === "review";
  const canReopen = homeowner && item.status === "resolved";
  const canSubmit = !homeowner && item.status === "open";
  // Until the contractor responds, the homeowner can add detail.
  const canEdit = !closed && homeowner && item.status === "open";
  const acting = !closed && (canReview || canReopen || canSubmit);
  const saveDetail = (photo?: Photo) =>
    commit({
      type: "punch-edit",
      projectId: p.id,
      id: item.id,
      note: detail ?? item.note,
      photo,
      at: new Date().toISOString(),
    }).then(() => setDetail(null));
  const photos: (GalleryPhoto & { label: string })[] = [
    item.photo && { ...item.photo, label: "The problem" },
    item.fixPhoto && { ...item.fixPhoto, label: "The fix" },
  ]
    .filter((photo) => !!photo)
    .map((photo) => ({
      id: photo.id,
      source: photo.uri,
      name: photo.label + " · " + item.title,
      label: photo.label,
    }));
  return (
    <Screen error={task.error}>
      <View style={{ gap: 10 }}>
        <Badge warm={item.status !== "resolved"}>
          {item.status === "review"
            ? homeowner
              ? "Fix submitted · Ready for your review"
              : "Fix submitted · Waiting for homeowner"
            : item.status === "resolved"
              ? "Resolved"
              : "Open"}
        </Badge>
        <Heading>{item.title}</Heading>
        {!canEdit && !!item.note && <Copy>{item.note}</Copy>}
      </View>
      {canEdit && (
        <Field
          label="Detail"
          multiline
          value={detail ?? item.note}
          onChangeText={setDetail}
          placeholder="Where is it? What should be different?"
          maxLength={1000}
        />
      )}
      {canEdit && edited && (
        <Button
          title="Save detail"
          busy={task.busy}
          onPress={() => task.run(() => saveDetail())}
        />
      )}
      {photos.length > 0 && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {photos.map((photo, i) => (
            <Pressable
              key={photo.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={photo.name}
              onPress={() => setViewing(i)}
              style={{ flex: 1, gap: 6 }}
            >
              <Image
                source={photo.source}
                recyclingKey={photo.id}
                contentFit="cover"
                transition={150}
                style={{
                  height: photos.length > 1 ? 160 : 210,
                  borderRadius: 12,
                  backgroundColor: colors.sage,
                }}
              />
              <Copy tone="muted" style={{ fontSize: 13 }}>
                {photo.label}
              </Copy>
            </Pressable>
          ))}
        </View>
      )}
      {canEdit && (
        <Button
          title={item.photo ? "Replace photo" : "Add a photo"}
          icon="camera"
          variant="secondary"
          disabled={task.busy}
          onPress={() =>
            task.run(async () => {
              const [picked] = await addPhotos(1);
              if (picked) await saveDetail(picked);
            })
          }
        />
      )}
      {item.resolution && (
        <Card>
          <Eyebrow>Latest note</Eyebrow>
          <Copy>{item.resolution}</Copy>
        </Card>
      )}
      {acting && (
        <Field
          label={
            canSubmit
              ? "What did you fix?"
              : canReview
                ? "Note (needed if it still needs work)"
                : "Why are you reopening it?"
          }
          value={note}
          onChangeText={setNote}
          multiline
          placeholder={
            canSubmit
              ? "Tell the homeowner what you fixed."
              : "What still needs attention?"
          }
          maxLength={1000}
        />
      )}
      {!closed && canSubmit && fixPhoto && (
        <Image
          source={fixPhoto.uri}
          accessibilityLabel="Photo of the fix"
          contentFit="cover"
          style={{ height: 210, width: "100%", borderRadius: 12 }}
        />
      )}
      {!closed && canSubmit && (
        <Button
          title={
            fixPhoto ? "Choose a different photo" : "Add a photo of the fix"
          }
          icon="camera"
          variant="secondary"
          disabled={task.busy}
          onPress={() =>
            task.run(async () => {
              const [picked] = await addPhotos(1);
              if (picked) setFixPhoto(picked);
            })
          }
        />
      )}
      {!closed && canReview && (
        <Button
          title="Accept the fix"
          icon="check"
          busy={task.busy}
          onPress={() => act("resolved")}
        />
      )}
      {!closed && (canReview || canReopen) && (
        <Button
          title={canReopen ? "Reopen item" : "Needs more work"}
          variant="secondary"
          disabled={task.busy}
          onPress={() => act("open")}
        />
      )}
      {!closed && canSubmit && (
        <Button
          title="Send for homeowner review"
          busy={task.busy}
          onPress={() => act("review")}
        />
      )}
      {!closed && !acting && (
        <Note>
          {homeowner
            ? "Waiting for your contractor to submit a fix. You’ll decide whether it’s resolved."
            : "Waiting for the homeowner to review your fix. Only they can close the item."}
        </Note>
      )}
      <PhotoViewer
        photos={photos}
        index={viewing}
        onClose={() => setViewing(null)}
      />
    </Screen>
  );
}
