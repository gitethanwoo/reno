import { View } from "react-native";
import { useProject } from "@/features/use-project";
import { contractorOf, type Project } from "@/domain/model";
import { useInvite } from "@/features/use-invite";
import {
  Button,
  Card,
  Check,
  Copy,
  Empty,
  Eyebrow,
  Note,
  Screen,
  Title,
  useTask,
} from "@/components/ui";
import { fonts } from "@/components/theme";

const shared = [
  "The scope, area and timing",
  "Your project photos",
  "Quotes, start date and schedule",
  "Change requests and your decisions",
  "The payments log",
  "The punch list and project updates",
];

export default function Invite() {
  const { project: p, role } = useProject();
  const task = useTask();
  if (!p)
    return (
      <Screen error={task.error}>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const contractor = contractorOf(p);
  if (role !== "homeowner" || contractor)
    return (
      <Screen error={task.error}>
        <Empty
          title={
            contractor
              ? contractor.name + " is already on this project."
              : "Only the homeowner can invite."
          }
          text="Each project has one homeowner and one contractor."
        />
      </Screen>
    );
  return <InviteScreen p={p} />;
}

function InviteScreen({ p }: { p: Project }) {
  const task = useTask();
  const { offline, expiry, expired, share, sendNew, cancel } = useInvite(p);
  return (
    <Screen
      error={task.error}
      footer={
        <Button
          title={expiry ? "Share link again" : "Share invite link"}
          icon="arrow"
          busy={task.busy}
          disabled={offline}
          onPress={() => task.run(share)}
        />
      }
    >
      <Title sub="Text your contractor a link. They tap it, see this project, and join. The link works once, for 48 hours.">
        Invite your contractor
      </Title>
      {expiry ? (
        <Card style={{ gap: 12 }}>
          <Eyebrow>Link sent</Eyebrow>
          <Copy>
            Expires {expiry}. It stops working once your contractor joins.
          </Copy>
          <View style={{ gap: 4 }}>
            <Button
              title="Send a new link"
              variant="secondary"
              disabled={task.busy}
              onPress={() => task.run(sendNew)}
            />
            <Button
              title="Cancel invite"
              variant="quiet"
              disabled={task.busy}
              onPress={() => task.run(cancel)}
            />
          </View>
        </Card>
      ) : (
        expired && (
          <Note warning>Your last link expired. Share a new one below.</Note>
        )
      )}
      <View style={{ gap: 4 }}>
        <Copy style={{ fontFamily: fonts.medium }}>
          Once they join, your contractor sees everything in this project:
        </Copy>
        {shared.map((line) => (
          <Check key={line} done>
            {line}
          </Check>
        ))}
      </View>
      <Copy tone="muted" style={{ fontSize: 14 }}>
        They can send a quote, propose changes, post updates and submit
        punch-list fixes. Only you accept quotes, approve changes and close the
        project.
      </Copy>
      {offline && (
        <Note>
          Sign in on your iPhone to invite your contractor. The sample notebook
          stays on this device.
        </Note>
      )}
    </Screen>
  );
}
