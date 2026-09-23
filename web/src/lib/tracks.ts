import type { Locale } from '../i18n';
import { entryPath, sectionPath } from '../i18n/routes';
import type { Track } from './progress/next-steps';
import { getLocalizedEntries } from './collections';

/**
 * Ladders the reader can be on, built from published content. The next-steps panel needs
 * these at build time because it cannot read collections once it is in the browser.
 */
export async function professionTracks(locale: Locale): Promise<Track[]> {
  const entries = await getLocalizedEntries('professions', locale);

  return entries
    .map((entry) => ({
      ref: { kind: 'profession' as const, profession: entry.data.translationKey },
      label: entry.data.name,
      steps: entry.data.steps,
      href: entryPath('professions', entry.data.slug, locale),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

/** Display names by key, for islands that cannot reach the collection themselves. */
export async function professionNames(locale: Locale): Promise<Record<string, string>> {
  const entries = await getLocalizedEntries('professions', locale);
  return Object.fromEntries(entries.map((entry) => [entry.data.translationKey, entry.data.name]));
}

/** Every step of a faction's route, flattened in order. */
export async function levelingRoute(
  locale: Locale,
  faction: 'alliance' | 'horde',
): Promise<Track | undefined> {
  const entries = await getLocalizedEntries('levelingRoutes', locale);
  const route = entries.find((entry) => entry.data.faction === faction);
  if (route === undefined) return undefined;

  return {
    ref: { kind: 'leveling' },
    label: route.data.title,
    steps: route.data.segments.flatMap((segment) => segment.steps),
    href: sectionPath('leveling', locale),
  };
}

/**
 * Both routes, so an island can switch faction without another request. The next-steps
 * panel picks the one matching the character.
 */
export async function levelingRoutes(
  locale: Locale,
): Promise<Partial<Record<'alliance' | 'horde', Track>>> {
  const [alliance, horde] = await Promise.all([
    levelingRoute(locale, 'alliance'),
    levelingRoute(locale, 'horde'),
  ]);

  return {
    ...(alliance === undefined ? {} : { alliance }),
    ...(horde === undefined ? {} : { horde }),
  };
}

export type { Track };
