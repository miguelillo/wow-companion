/**
 * Language setup. English is served without a prefix; Spanish lives under /es/.
 * Spanish remains the source of truth for interface copy: every other language is typed
 * against it, so a missing key is a build error rather than a blank label.
 */
export const locales = ['en', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** BCP 47 tags for `<html lang>`, hreflang and sitemap alternates. */
export const localeTags: Record<Locale, string> = {
  en: 'en',
  es: 'es',
};

/** Names shown in the language picker, each in its own language. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Reads the locale from a pathname. Anything without a known prefix is the default locale. */
export function localeFromPath(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment !== undefined && isLocale(segment) ? segment : defaultLocale;
}
