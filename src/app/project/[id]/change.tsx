import { router } from "expo-router";
import { View } from "react-native";
import { confirm } from "@/lib/confirm";
import { backToProject, finish } from "@/lib/navigation";
import { useProject } from "@/features/use-project";
import { addDays, dateLabel, money, total } from "@/domain/model";
import {
  Badge,
  Button,
  Card,
  Copy,
  Divider,
  Empty,
  ErrorNote,
  Heading,
  LineItem,
  Note,
  Screen,
  plural,
  useTask,
} from "@/components/ui";
export default function ChangeReview() {
  const { project: p, params, role, commit } = useProject();
  const task = useTask();
  const c = p?.changes.find((c) => c.id === params.changeId) ?? p?.changes[0];
  if (!p || !c)
    return (
      <Screen>
        <Empty
          title="No change to review."
          text="Proposals will appear in your project record."
        />
      </Screen>
    );
  const decide = (decision: "approved" | "declined") =>
    task.run(async () => {
      await commit({
        type: "change-decision",
        projectId: p.id,
        id: c.id,
        decision,
        at: new Date().toISOString(),
      });
      finish(p.id);
    });
  const confirmDecline = () =>
    confirm({
      title: "Decline this change?",
      message:
        "The contractor will see it was declined. The budget and schedule stay as agreed.",
      action: "Decline",
      destructive: true,
      onConfirm: () => decide("declined"),
    });
  const pending = c.status === "pending";
  return (
    <Screen
      footer={
        pending && role === "homeowner" ? (
          <View style={{ gap: 8 }}>
            <Button
              title="Approve change"
              icon="check"
              busy={task.busy}
              onPress={() => decide("approved")}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Decline"
                  variant="secondary"
                  disabled={task.busy}
                  onPress={confirmDecline}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Ask a question"
                  variant="secondary"
                  disabled={task.busy}
                  onPress={() =>
                    router.push({
                      pathname: "/project/[id]/update",
                      params: { id: p.id, text: "About “" + c.title + "”: " },
                    })
                  }
                />
              </View>
            </View>
          </View>
        ) : (
          <Button title="Back to project" onPress={() => backToProject(p.id)} />
        )
      }
    >
      <View style={{ gap: 10 }}>
        <Badge warm={pending}>
          {pending
            ? role === "homeowner"
              ? "Waiting for your decision"
              : "Waiting for the homeowner"
            : c.status === "approved"
              ? "Approved"
              : "Declined"}
        </Badge>
        <Heading>{c.title}</Heading>
        <Copy tone="muted">
          Proposed by {p.quote?.company ?? "your contractor"}
          {c.decidedAt ? " · Decided " + dateLabel(c.decidedAt) : ""}
        </Copy>
      </View>
      <Copy>{c.reason}</Copy>
      <Card>
        <LineItem label="Added cost" value={"+" + money(c.cents)} strong />
        <LineItem
          label="Added time"
          value={"+" + plural(c.days, "day")}
          strong
        />
        <Divider />
        <LineItem
          label="Project total"
          value={
            pending
              ? money(total(p)) + " → " + money(total(p) + c.cents)
              : money(total(p))
          }
        />
        {p.finish && (
          <LineItem
            label="Finish date"
            value={
              pending
                ? dateLabel(p.finish) +
                  " → " +
                  dateLabel(addDays(p.finish, c.days))
                : dateLabel(p.finish)
            }
          />
        )}
      </Card>
      <Note warning={pending}>
        {pending
          ? "Nothing changes until it’s approved. Until then, the agreed budget and schedule stay the same."
          : c.status === "approved"
            ? "The new total and finish date are now part of the agreed project."
            : "Declined changes stay in the record. The agreed budget and schedule did not change."}
      </Note>
      <ErrorNote error={task.error} />
    </Screen>
  );
}
