import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import { expoPasskeyClient } from "expo-better-auth-passkey";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
  plugins: [
    convexClient(),
    anonymousClient(),
    expoPasskeyClient(),
    ...(Platform.OS === "web"
      ? [crossDomainClient()]
      : [
          expoClient({
            scheme: "reno",
            storagePrefix: "reno",
            storage: SecureStore,
          }),
        ]),
  ],
});

// React 19's development profiler reads function.name on props. Better Auth's
// callable route proxy treats .name as an API route, so pass the component a
// plain facade containing only the methods its provider uses.
export const providerAuthClient = {
  useSession: authClient.useSession,
  getSession: (...args: Parameters<typeof authClient.getSession>) =>
    authClient.getSession(...args),
  convex: {
    token: (...args: Parameters<typeof authClient.convex.token>) =>
      authClient.convex.token(...args),
  },
  crossDomain: {
    oneTimeToken: {
      verify: (
        ...args: Parameters<typeof authClient.crossDomain.oneTimeToken.verify>
      ) => authClient.crossDomain.oneTimeToken.verify(...args),
    },
  },
  updateSession: () => authClient.updateSession(),
};
