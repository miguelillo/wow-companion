import type { Section } from '../i18n/routes';

/**
 * Sections whose page exists but whose content is not written yet. They are kept out of
 * the index and out of the sitemap: an empty page that ranks is worse than no page.
 * Remove a section from this list in the phase that writes it.
 */
export const pendingSections: readonly Section[] = [
  'start',
  'leveling',
  'gold',
  'dungeons',
  'raids',
  'classes',
];

export function isPending(section: Section): boolean {
  return pendingSections.includes(section);
}
