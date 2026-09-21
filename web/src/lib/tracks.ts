import type { Locale } from '../i18n';
import { entryPath } from '../i18n/routes';
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

export type { Track };
