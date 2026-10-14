import { router } from "expo-router";
import { View } from "react-native";
import { useProject } from "@/features/use-project";
import { addDays, dateLabel, money, total } from "@/domain/model";
import {
  Badge,
  Button,
  Card,
  Copy,
  Empty,
  ErrorNote,
  Eyebrow,
  Heading,
  Note,
  Row,
  Screen,
  useTask,
} from "@/components/ui";
export default function ChangeReview() {
  const { project: p, params, state, commit } = useProject();
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
    });
  const pending = c.status === "pending";
  return (
    <Screen
      footer={
        pending && state.role === "homeowner" ? (
          <View style={{ gap: 8 }}>
            <Button
              title="Approve change"
              icon="check"
              busy={task.busy}
              onPress={() => decide("approved")}
            />
            <Button
              title="Decline change"
              variant="secondary"
              disabled={task.busy}
              onPress={() => decide("declined")}
            />
          </View>
        ) : (
          <Button
            title="Back to project"
            onPress={() =>
              router.replace({
                pathname: "/project/[id]",
                params: { id: p.id },
              })
            }
          />
        )
      }
    >
      <Eyebrow>Change request</Eyebrow>
      <Heading>
        {pending ? "You decide\nwhat changes." : "Your decision\nis saved."}
      </Heading>
      <Badge warm={pending}>
        {pending
          ? "Awaiting your approval"
          : c.status === "approved"
            ? "Approved by you"
            : "Declined"}
      </Badge>
      <Heading small>{c.title}</Heading>
      <Copy>{c.reason}</Copy>
      <Card>
        <Row title="Added cost" detail={"+" + money(c.cents)} />
        <Row title="Extra time" detail={"+" + c.days + " day(s)"} />
        <Row
          title={pending ? "Proposed project total" : "Approved project total"}
          detail={money(total(p) + (pending ? c.cents : 0))}
        />
        {p.finish && (
          <Row
            title={pending ? "Proposed finish date" : "Current finish date"}
            detail={dateLabel(pending ? addDays(p.finish, c.days) : p.finish)}
          />
        )}
      </Card>
      <Note>
        {pending
          ? "Work on this change starts only after your approval. Until then, your agreed budget and schedule stay the same."
          : c.status === "approved"
            ? "The new total and finish date are recorded in your project."
            : "This decision is in your project record. Your agreed budget and schedule did not change."}
      </Note>
      {pending && (
        <Button
          title="Ask a question first"
          variant="quiet"
          icon="message"
          onPress={() =>
            router.push({
              pathname: "/project/[id]/update",
              params: { id: p.id },
            })
          }
        />
      )}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
