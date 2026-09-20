import { defaultLocale, locales, type Locale } from './config';

/**
 * Section identifiers are English and never change; the slug that reaches the URL is
 * content and is translated per language. Route files mirror these slugs because Astro
 * derives URLs from the filesystem, but the logic behind them lives once in src/sections/.
 */
export const sections = [
  'home',
  'status',
  'start',
  'leveling',
  'professions',
  'gold',
  'dungeons',
  'raids',
  'classes',
  'patches',
] as const;

export type Section = (typeof sections)[number];

const sectionSlugs: Record<Section, Record<Locale, string>> = {
  home: { es: '', en: '' },
  status: { es: 'estado', en: 'status' },
  start: { es: 'empezar', en: 'start' },
  leveling: { es: 'leveleo', en: 'leveling' },
  professions: { es: 'profesiones', en: 'professions' },
  gold: { es: 'oro', en: 'gold' },
  dungeons: { es: 'mazmorras', en: 'dungeons' },
  raids: { es: 'raids', en: 'raids' },
  classes: { es: 'clases', en: 'classes' },
  patches: { es: 'parches', en: 'patches' },
};

export function sectionSlug(section: Section, locale: Locale): string {
  return sectionSlugs[section][locale];
}

/** Builds an absolute site path. The default locale carries no prefix. */
export function localizePath(locale: Locale, ...segments: readonly string[]): string {
  const parts = [
    ...(locale === defaultLocale ? [] : [locale]),
    ...segments.filter((segment) => segment.length > 0),
  ];
  return `/${parts.join('/')}`;
}

/** Path of a section index, e.g. `/profesiones` or `/en/professions`. */
export function sectionPath(section: Section, locale: Locale): string {
  return localizePath(locale, sectionSlug(section, locale));
}

/** Path of a single entry inside a section, e.g. `/profesiones/alquimia`. */
export function entryPath(section: Section, slug: string, locale: Locale): string {
  return localizePath(locale, sectionSlug(section, locale), slug);
}

/**
 * Every locale's path for the same section, for hreflang and the language picker.
 * Entry pages pass their sibling slugs instead, since a translation may not exist yet.
 */
export function sectionAlternates(section: Section): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, sectionPath(section, locale)]),
  ) as Record<Locale, string>;
}

/** The nav, in order. `home` is the logo, so it is not repeated here. */
export const navSections: readonly Section[] = [
  'status',
  'start',
  'leveling',
  'professions',
  'gold',
  'dungeons',
  'raids',
  'classes',
  'patches',
];
