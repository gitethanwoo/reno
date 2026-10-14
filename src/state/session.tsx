import React, { createContext, use, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Image } from "expo-image";
import { useGlobalSearchParams, useSegments } from "expo-router";
import { ConvexReactClient, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ConvexBetterAuthProvider,
  type AuthClient,
} from "@convex-dev/better-auth/react";
import { authClient, providerAuthClient } from "@/lib/auth-client";
import {
  Button,
  Copy,
  ErrorNote,
  Heading,
  Note,
  Screen,
  Wordmark,
  useTask,
} from "@/components/ui";
import { kitchen } from "@/components/project-card";
import { colors } from "@/components/theme";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});
const SessionContext = createContext({ preview: false, exitPreview: () => {} });
export const useSessionMode = () => use(SessionContext);
function Gate({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const keys = authClient.useListPasskeys();
  const [preview, setPreview] = useState(false);
  const task = useTask();
  const browserPreview = Platform.OS === "web";
  const secured = !!session.data && !!keys.data?.length;
  // Opened from an invite link while signed out: say who it's from. The
  // route stays put underneath, so signing in lands on the join screen.
  const segments = useSegments();
  const { token } = useGlobalSearchParams<{ token?: string }>();
  const inviteToken =
    !secured && segments[0] === "join" && typeof token === "string"
      ? token
      : null;
  const invite = useQuery(
    api.invites.welcome,
    inviteToken ? { token: inviteToken } : "skip",
  );
  // iOS reports "no passkey for Reno" and "the person closed the sheet" as
  // the same cancellation, on purpose. So Continue always creates a passkey
  // and returning people sign in separately; guessing would risk making a
  // second account for someone who only cancelled.
  async function register() {
    if (!session.data) {
      const result = await authClient.signIn.anonymous();
      if (result.error) throw new Error(result.error.message);
    }
    const result = await authClient.passkey.addPasskey({
      name: "Reno notebook",
    });
    if (result?.error)
      throw new Error(
        result.error.message ||
          "Passkey setup was cancelled. Please try again.",
      );
    await keys.refetch();
    await session.refetch();
  }
  async function signIn() {
    const result = await authClient.signIn.passkey();
    if (result?.error)
      throw new Error(
        "code" in result.error && result.error.code === "ERROR_CEREMONY_ABORTED"
          ? "No passkey was used. New to Reno? Tap Continue to create one."
          : result.error.message || "Sign-in didn't finish. Please try again.",
      );
    await session.refetch();
    await keys.refetch();
  }
  if (preview || secured)
    return (
      <SessionContext value={{ preview, exitPreview: () => setPreview(false) }}>
        {children}
      </SessionContext>
    );
  if (session.isPending)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 24, paddingTop: 48 }}>
        <Wordmark />
      </View>
      <Image
        source={kitchen}
        contentFit="cover"
        style={{ width: "100%", height: 250 }}
      />
      <View style={{ paddingHorizontal: 24, gap: 18 }}>
        {invite ? (
          <>
            <Heading display>Join {invite.title}</Heading>
            <Copy>
              Invited by {invite.homeowner}. Create a passkey to see the scope,
              photos and record, and send your quote.
            </Copy>
          </>
        ) : (
          <>
            <Heading display>Your home.{"\n"}Your say.</Heading>
            <Copy>
              One clear record, from the first idea to the final walkthrough.
            </Copy>
          </>
        )}
        <Button
          title="Continue"
          icon="arrow"
          busy={task.busy}
          disabled={browserPreview}
          onPress={() => task.run(register)}
        />
        <Button
          title="I already have an account"
          variant="quiet"
          disabled={task.busy || browserPreview}
          onPress={() => task.run(signIn)}
        />
        <ErrorNote error={task.error} />
        {browserPreview && (
          <Note>
            Use the iPhone development build to create your passkey. You can
            explore the sample notebook in this browser.
          </Note>
        )}
        <Copy tone="muted" style={{ fontSize: 13 }}>
          Your device keeps your passkey secure. Your notebook syncs privately
          with your account.
        </Copy>
        <Button
          title="Explore a sample notebook"
          variant="quiet"
          onPress={() => setPreview(true)}
        />
      </View>
    </Screen>
  );
}
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={providerAuthClient as unknown as AuthClient}
    >
      <Gate>{children}</Gate>
    </ConvexBetterAuthProvider>
  );
}
