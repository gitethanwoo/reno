/** The link a contractor taps to join. Expo Router maps it to /join/[token]. */
export const inviteUrl = (token: string) =>
  `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/join/${token}`;

/** "in 47 hours", "in under an hour", or null once the link has expired. */
export function expiresIn(expiresAt: string, now: number) {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "in under an hour";
  return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
}
