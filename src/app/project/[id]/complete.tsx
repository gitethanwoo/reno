import { useState } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useProject } from "@/features/use-project";
import { remaining, money, total } from "@/domain/model";
import { kitchen } from "@/components/project-card";
import { View } from "react-native";
import {
  Button,
  Card,
  Check,
  Checkbox,
  Copy,
  Divider,
  Empty,
  ErrorNote,
  LineItem,
  Screen,
  Title,
  plural,
  useTask,
} from "@/components/ui";
import { exportProject } from "@/lib/export-project";
export default function Complete() {
  const { project: p, commit } = useProject();
  const task = useTask();
  const [confirmed, setConfirmed] = useState(false);
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const complete = p.status === "completed",
    open = p.punch.filter((i) => i.status !== "resolved").length,
    pending = p.changes.filter((c) => c.status === "pending").length;
  const ready = !open && !pending && remaining(p) === 0;
  return (
    <Screen
      footer={
        complete ? (
          <View style={{ gap: 8 }}>
            <Button
              title="Export project record"
              icon="download"
              busy={task.busy}
              onPress={() => task.run(() => exportProject(p))}
            />
            <Button
              title="Back to project"
              variant="quiet"
              onPress={() => router.back()}
            />
          </View>
        ) : (
          <Button
            title="Complete project"
            icon="check"
            disabled={!confirmed || !ready}
            busy={task.busy}
            onPress={() =>
              task.run(async () => {
                await commit({
                  type: "complete",
                  projectId: p.id,
                  at: new Date().toISOString(),
                });
              })
            }
          />
        )
      }
    >
      <Title
        sub={
          complete
            ? "The quote, changes, payments, photos and punch list stay together in this record."
            : ready
              ? "Everything is settled. Confirm you’ve checked the work to close the job."
              : "A few things need to be settled before you close the job."
        }
      >
        {complete ? "Project complete" : "Finish the project"}
      </Title>
      {complete && (
        <Image
          source={p.photos[0]?.uri ?? kitchen}
          contentFit="cover"
          style={{ width: "100%", height: 220, borderRadius: 14 }}
        />
      )}
      <Card style={{ gap: 6 }}>
        <Check done={!open}>
          {open
            ? plural(open, "punch item") + " still open"
            : "Punch list resolved"}
        </Check>
        <Check done={!pending}>
          {pending
            ? plural(pending, "change") + " waiting for a decision"
            : "All changes decided"}
        </Check>
        <Check done={remaining(p) === 0}>
          {remaining(p)
            ? money(remaining(p)) + " not yet logged as paid"
            : "All payments logged"}
        </Check>
        {complete && (
          <>
            <Divider />
            <LineItem label="Final cost" value={money(total(p))} strong />
          </>
        )}
      </Card>
      {!complete && (
        <Checkbox
          label="I’ve checked the finished work in person"
          checked={confirmed}
          onChange={setConfirmed}
        />
      )}
      {!complete && (
        <Copy tone="muted" style={{ fontSize: 14 }}>
          Completing the project locks the record. You can still view and
          export it.
        </Copy>
      )}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
