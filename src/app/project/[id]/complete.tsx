import { useState } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useProject } from "@/features/use-project";
import { remaining, money, total } from "@/domain/model";
import { kitchen } from "@/components/project-card";
import {
  Button,
  Card,
  Copy,
  Empty,
  ErrorNote,
  Heading,
  Note,
  Row,
  Screen,
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
  return (
    <Screen>
      <Heading>
        {complete ? "A job\nwell kept." : "Finish with\neverything in place."}
      </Heading>
      {complete && (
        <Image
          source={p.photos[0]?.uri ?? kitchen}
          contentFit="cover"
          style={{ width: "100%", height: 220, borderRadius: 14 }}
        />
      )}
      <Card>
        <Row
          icon="check"
          title={
            open ? open + " punch items still open" : "Punch list resolved"
          }
        />
        <Row
          icon="file"
          title={
            pending
              ? pending + " changes awaiting a decision"
              : "All changes decided"
          }
        />
        <Row
          icon="money"
          title={
            remaining(p)
              ? money(remaining(p)) + " remaining to log"
              : "Payments reconciled"
          }
        />
      </Card>
      {complete ? (
        <>
          <Copy>Final approved cost · {money(total(p))}</Copy>
          <Button
            title="Export project record"
            icon="download"
            onPress={() => task.run(() => exportProject(p))}
          />
          <Button
            title="Back to project"
            variant="secondary"
            onPress={() => router.back()}
          />
        </>
      ) : (
        <>
          <Note>
            Check the work in person before completing your project. This closes
            the notebook for editing.
          </Note>
          <Button
            title={
              confirmed
                ? "✓ I’ve reviewed the completed work"
                : "I’ve reviewed the completed work"
            }
            variant="secondary"
            onPress={() => setConfirmed(!confirmed)}
          />
          <Button
            title="Complete project"
            disabled={
              !confirmed || open > 0 || pending > 0 || remaining(p) !== 0
            }
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
        </>
      )}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
