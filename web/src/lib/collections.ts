import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { Locale } from '../i18n';

/** Collections whose entries are grouped by language folder. */
export type LocalizedCollection = Extract<
  CollectionKey,
  'zones' | 'professions' | 'dungeons' | 'classes' | 'levelingRoutes' | 'patches' | 'guides'
>;

/** Entries of one collection in one language. Drafts are dropped from production builds. */
export async function getLocalizedEntries<C extends LocalizedCollection>(
  collection: C,
  locale: Locale,
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection);
  return entries.filter(
    (entry) => entry.data.lang === locale && (import.meta.env.PROD ? !entry.data.draft : true),
  );
}

/** Patches, newest first. */
export async function getPatches(
  locale: Locale,
  limit?: number,
): Promise<CollectionEntry<'patches'>[]> {
  const entries = await getLocalizedEntries('patches', locale);
  entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return limit === undefined ? entries : entries.slice(0, limit);
}

/**
 * The sibling of an entry in another language, matched by translationKey. Returns
 * undefined when the translation is not written yet, which the language picker says out
 * loud instead of pretending the page exists.
 */
export async function findTranslation<C extends LocalizedCollection>(
  collection: C,
  translationKey: string,
  locale: Locale,
): Promise<CollectionEntry<C> | undefined> {
  const entries = await getLocalizedEntries(collection, locale);
  return entries.find((entry) => entry.data.translationKey === translationKey);
}
