# Development verification — October 13, 2026

- TypeScript, ESLint, and six Convex tests pass.
- Expo Doctor: 21/21 checks pass.
- iOS production JavaScript bundle exports successfully.
- Native iOS simulator build succeeds: zero errors, one Expo development-launcher build-phase warning. Installed on the iPhone 18 Pro simulator (iOS 27).
- Convex functions deployed to development `ethan-8dbbd:reno / insightful-viper-971`.
- Live WebAuthn protocol: disposable P-256 credential registered, signed assertion authenticated, issued JWT accessed the private Convex notebook. Test credential removed afterward. The manual verification script is `scripts/verify-passkeys.mjs`.
- Apple association endpoint serves team `NSJPQ3TSBT` and bundle `com.athanir.reno`.
- Browser walkthrough: four-step project creation, sample change approval ($4,800 → $5,040 and Oct 23 → Oct 24), and persistence after reload. Mobile screenshot saved alongside this file.
- React 19 development profiler encountered Better Auth's callable proxy in component props; a plain provider facade fixes the reload crash. Fresh reload and saved notebook verified afterward.

- Signed physical-device preview 0.1.0 (1): [EAS build b25419b0](https://expo.dev/accounts/athanir/projects/reno/builds/b25419b0-5fe0-4b14-ad04-ffbbfb8acc2c), finished October 13 at 8:32 PM Eastern. Downloaded IPA inspected: code signature verifies, new registered iPhone is provisioned, JavaScript is bundled, and signed associated-domain entitlement matches the passkey backend. Apple association CDN also returns the correct app identity. Provisioning expires January 8, 2027.
- IPA SHA-256: `432456751691c9b8013eec14bb6d87ead234fdf2fee30a1bc7d07362929a3202`.

Remaining verification: native visual walkthrough and real-device passkey creation/Face ID. The Mac was locked during the final simulator UI check. The signed preview is ready to install; installation and launch on the physical phone are not yet confirmed. No TestFlight upload or store submission has run.

Dependency audit has no critical findings after updating the test runner; remaining moderate/high findings are in the Expo/native dependency tree and need a compatibility-preserving dependency pass before production distribution. This is a development build, not a production release.
