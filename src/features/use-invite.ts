import { useState } from "react";
import { Platform, Share } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Project } from "@/domain/model";
import { expiresIn, inviteUrl } from "@/lib/invite";
import { useAskForPush } from "@/lib/push";
import { useSessionMode } from "@/state/session";
import { useStore } from "@/state/store";

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

/** The project's invite link: whether one is live, and sharing it. */
export function useInvite(p: Project) {
  const { state } = useStore();
  const { preview } = useSessionMode();
  const create = useMutation(api.invites.create);
  const revoke = useMutation(api.invites.revoke);
  // Once the link is out, offer to say when the contractor joins.
  const askForPush = useAskForPush();
  const [now] = useState(() => Date.now());
  // Preview mode and the sample project never talk to the server.
  const offline = preview || p.isSample;
  const from =
    p.members?.find((m) => m.role === "homeowner")?.name || state.name;
  const invite = offline ? null : (p.invite ?? null);
  const expiry = invite ? expiresIn(invite.expiresAt, now) : null;
  const open = invite && expiry ? invite : null;
  const sendNew = async () => {
    const { token } = await create({ projectId: p.id });
    await shareLink(p, from, token);
    await askForPush();
  };
  return {
    offline,
    /** "in 47 hours" while a link is live. */
    expiry: open ? expiry : null,
    /** A link was sent but has run out. */
    expired: !!invite && !open,
    /** Re-share the live link, or make one. */
    share: async () => {
      if (!open) return sendNew();
      await shareLink(p, from, open.token);
      await askForPush();
    },
    sendNew,
    cancel: async () => {
      await revoke({ projectId: p.id });
    },
  };
}
