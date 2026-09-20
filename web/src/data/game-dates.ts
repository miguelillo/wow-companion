/**
 * Announced dates for World of Warcraft: Forever, as stated at BlizzCon on 12 September
 * 2026. Everything else about the game is beta information and may change.
 */
export const gameDates = {
  announcement: new Date('2026-09-12T00:00:00Z'),
  betaStart: new Date('2026-09-17T00:00:00Z'),
  launch: new Date('2026-11-04T00:00:00Z'),
} as const;

/** Whole days left until launch, in UTC. Zero on launch day, negative afterwards. */
export function daysUntilLaunch(now: Date = new Date()): number {
  const msPerDay = 86_400_000;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const launch = Date.UTC(
    gameDates.launch.getUTCFullYear(),
    gameDates.launch.getUTCMonth(),
    gameDates.launch.getUTCDate(),
  );
  return Math.round((launch - today) / msPerDay);
}
