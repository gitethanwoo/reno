import { useState } from "react";
import { useDiscardGuard } from "@/lib/discard";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Photo } from "@/domain/model";
import { useProject } from "@/features/use-project";
import { uid } from "@/state/store";
import { Button, Empty, Field, Title, Screen, useTask } from "@/components/ui";
export default function Update() {
  const { project: p, commit, addPhoto, params } = useProject();
  const task = useTask();
  const [text, setText] = useState(params.text ?? "");
  const [photo, setPhoto] = useState<Photo>();
  const [id] = useState(uid);
  const allowLeave = useDiscardGuard(
    text.trim() !== (params.text ?? "").trim() || !!photo,
  );
  if (!p)
    return (
      <Screen error={task.error}>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  return (
    <Screen
      error={task.error}
      keyboard
      footer={
        <Button
          title="Post update"
          icon="arrow"
          busy={task.busy}
          onPress={() =>
            task.run(async () => {
              await commit({
                type: "update",
                projectId: p.id,
                id,
                text,
                photo,
                at: new Date().toISOString(),
              });
              allowLeave();
              router.back();
            })
          }
        />
      }
    >
      <Title sub={"Added to the " + p.title + " record with today’s date."}>
        Post an update
      </Title>
      <Field
        label="Your update"
        multiline
        placeholder="What happened, or what would you like to clarify?"
        value={text}
        onChangeText={setText}
        maxLength={2000}
      />
      {photo && (
        <Image
          source={photo.uri}
          style={{ height: 210, width: "100%", borderRadius: 12 }}
          contentFit="cover"
        />
      )}
      <Button
        title={photo ? "Choose a different photo" : "Add a photo"}
        icon="camera"
        variant="secondary"
        onPress={() =>
          task.run(async () => {
            const p = await addPhoto();
            if (p) setPhoto(p);
          })
        }
      />
    </Screen>
  );
}
