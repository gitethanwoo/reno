const pad = (n: number) => String(n).padStart(2, "0");

/** A Date as the local calendar day, YYYY-MM-DD. */
export const dayOf = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Today on the device's calendar (not UTC, which is a day ahead at night). */
export const today = () => dayOf(new Date());

/** YYYY-MM-DD as local noon, so time zones never shift the day. */
export const fromDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
