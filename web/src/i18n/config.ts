/** Language setup. Spanish is the source of truth and is served without a prefix. */
export const locales = ['es', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

/** BCP 47 tags for `<html lang>`, hreflang and sitemap alternates. */
export const localeTags: Record<Locale, string> = {
  es: 'es',
  en: 'en',
};

/** Names shown in the language picker, each in its own language. */
export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Reads the locale from a pathname. Anything without a known prefix is the default locale. */
export function localeFromPath(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment !== undefined && isLocale(segment) ? segment : defaultLocale;
}
