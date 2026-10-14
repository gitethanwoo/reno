import { useState } from "react";
import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import { remaining, money, total } from "@/domain/model";
import {
  PhotoStrip,
  PhotoViewer,
  galleryPhotos,
} from "@/components/photo-gallery";
import { View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { Icon } from "@/components/icon";
import { colors } from "@/components/theme";
import { backToProject, success } from "@/lib/navigation";
import {
  Button,
  Card,
  Check,
  Checkbox,
  Copy,
  Divider,
  Empty,
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
  const [viewing, setViewing] = useState<number | null>(null);
  if (!p)
    return (
      <Screen error={task.error}>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const complete = p.status === "completed",
    open = p.punch.filter((i) => i.status !== "resolved").length,
    pending = p.changes.filter((c) => c.status === "pending").length;
  const ready = !open && !pending && remaining(p) === 0;
  // Each line opens the place where it gets settled.
  const show = (tab: "overview" | "record" | "money" | "punch") =>
    router.push({ pathname: "/project/[id]", params: { id: p.id, tab } });
  const pendingChange = p.changes.find((c) => c.status === "pending");
  return (
    <Screen
      error={task.error}
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
              onPress={() => backToProject(p.id)}
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
                // Stay here: this screen becomes the finished record.
                success();
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
        <>
          <PhotoStrip photos={galleryPhotos(p)} onOpen={setViewing} />
          <PhotoViewer
            photos={galleryPhotos(p)}
            index={viewing}
            onClose={() => setViewing(null)}
          />
        </>
      )}
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <Step done={!open} onPress={() => show("punch")}>
          {open
            ? plural(open, "punch item") + " still open"
            : "Punch list resolved"}
        </Step>
        <Step
          done={!pending}
          divider
          onPress={() =>
            pending === 1 && pendingChange
              ? router.push({
                  pathname: "/project/[id]/change",
                  params: { id: p.id, changeId: pendingChange.id },
                })
              : show(pending ? "overview" : "record")
          }
        >
          {pending
            ? plural(pending, "change") + " waiting for a decision"
            : "All changes decided"}
        </Step>
        <Step done={remaining(p) === 0} divider onPress={() => show("money")}>
          {remaining(p)
            ? money(remaining(p)) + " not yet logged as paid"
            : "All payments logged"}
        </Step>
        {complete && (
          <>
            <Divider />
            <View style={{ paddingVertical: 12 }}>
              <LineItem label="Final cost" value={money(total(p))} strong />
            </View>
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
          Completing the project locks the record. You can still view and export
          it.
        </Copy>
      )}
    </Screen>
  );
}

/** A checklist line that opens where it gets settled, like a Settings row. */
function Step({
  done,
  divider = false,
  onPress,
  children,
}: {
  done: boolean;
  divider?: boolean;
  onPress: () => void;
  children: string;
}) {
  return (
    <TouchableRipple
      accessibilityRole="button"
      accessibilityLabel={children}
      onPress={onPress}
      style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 8,
          borderTopWidth: divider ? 1 : 0,
          borderTopColor: colors.line,
        }}
      >
        <View style={{ flex: 1 }}>
          <Check done={done}>{children}</Check>
        </View>
        <Icon name="chevron" size={18} />
      </View>
    </TouchableRipple>
  );
}
