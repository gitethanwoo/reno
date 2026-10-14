import { useState } from "react";
import { Platform, Share, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useProject } from "@/features/use-project";
import { useSessionMode } from "@/state/session";
import { contractorOf, type Project } from "@/domain/model";
import { expiresIn, inviteUrl } from "@/lib/invite";
import {
  Button,
  Card,
  Check,
  Copy,
  Empty,
  ErrorNote,
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

/**
 * iOS attaches `url` as a rich link, so the message leaves it out to avoid
 * pasting it twice. Android ignores `url`, so the link goes in the message.
 */
async function shareLink(p: Project, from: string, token: string) {
  const url = inviteUrl(token);
  const text = from + " invited you to “" + p.title + "” on Reno";
  await Share.share(
    Platform.OS === "ios"
      ? { message: text + ".", url }
      : { message: text + ": " + url },
  );
}

export default function Invite() {
  const { project: p, role, state } = useProject();
  const { preview } = useSessionMode();
  const create = useMutation(api.invites.create);
  const revoke = useMutation(api.invites.revoke);
  const task = useTask();
  const [now] = useState(() => Date.now());
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const contractor = contractorOf(p);
  if (role !== "homeowner" || contractor)
    return (
      <Screen>
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
  // Preview mode and the sample project never talk to the server.
  const offline = preview || p.isSample;
  const from =
    p.members?.find((m) => m.role === "homeowner")?.name || state.name;
  const invite = offline ? null : p.invite;
  const expiry = invite ? expiresIn(invite.expiresAt, now) : null;
  const open = invite && expiry ? invite : null;
  const sendNew = () =>
    task.run(async () => {
      const { token } = await create({ projectId: p.id });
      await shareLink(p, from, token);
    });
  return (
    <Screen
      footer={
        <Button
          title={open ? "Share link again" : "Share invite link"}
          icon="arrow"
          busy={task.busy}
          disabled={offline}
          onPress={() =>
            open
              ? task.run(() => shareLink(p, from, open.token))
              : sendNew()
          }
        />
      }
    >
      <Title sub="Text your contractor a link. They tap it, see this project, and join. The link works once, for 48 hours.">
        Invite your contractor
      </Title>
      {open ? (
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
              onPress={sendNew}
            />
            <Button
              title="Cancel invite"
              variant="quiet"
              disabled={task.busy}
              onPress={() =>
                task.run(async () => {
                  await revoke({ projectId: p.id });
                })
              }
            />
          </View>
        </Card>
      ) : (
        invite && (
          <Note warning>
            Your last link expired. Share a new one below.
          </Note>
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
      <ErrorNote error={task.error} />
    </Screen>
  );
}
