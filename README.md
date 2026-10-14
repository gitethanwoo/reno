# Reno

Expo SDK 57 / React Native app with React Native Paper, Expo Router, and a Convex backend. Source lives in `src/`; backend functions in `convex/`; the original visual direction is in `docs/design/`.

```sh
npm install
npm start                    # Metro
npm run web                  # Browser sample notebook on port 8086
npm run ios                  # Build and run the native iPhone simulator app
npm run typecheck
npm run lint
npm test
```

Linked projects: [Expo @athanir/reno](https://expo.dev/accounts/athanir/projects/reno) and Convex `ethan-8dbbd:reno` (development deployment `insightful-viper-971`). `.env.local` contains the development URLs and is ignored by Git.

[Install iPhone preview 0.1.0 (1)](https://expo.dev/accounts/athanir/projects/reno/builds/b25419b0-5fe0-4b14-ad04-ffbbfb8acc2c) from Safari on the registered iPhone. This signed ad hoc build runs without Metro. Additional phones must be registered and included in a new or re-signed build. Build with `npx eas-cli build --platform ios --profile preview`.

Working: project drafts, project creation, sample quote comparison, change approvals, payment records, progress updates/photos, punch-list review, completion checks, saved guides, and text export. Sample mode stores its notebook locally; authenticated notebooks use private Convex records.

Passkeys use the official Convex Better Auth component, Better Auth's WebAuthn plugin, and an Expo native bridge. iOS bundle `com.athanir.reno` is associated with `insightful-viper-971.convex.site` under Athanir team `NSJPQ3TSBT`. The backend registration/sign-in protocol is verified; Face ID and passkey creation on a signed physical iPhone still need testing. The local browser exposes sample mode because it does not share the native relying-party domain.

This is an initial development build. Contractor matching, invitations/shared projects, live quotes, AI document analysis, payment processing, and store submission are not implemented. Homeowner/contractor switching explores the two workflows within your own notebook; it is not multi-user contractor access. Payment actions only record payments made elsewhere.
