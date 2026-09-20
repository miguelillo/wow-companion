import { defaultLocale, type Locale } from './config';
import es, { type Dictionary, type DictionaryKey } from './ui/es';
import en from './ui/en';

export {
  defaultLocale,
  locales,
  localeNames,
  localeTags,
  isLocale,
  localeFromPath,
} from './config';
export type { Locale } from './config';
export type { Dictionary, DictionaryKey } from './ui/es';
export * from './routes';

const dictionaries: Record<Locale, Dictionary> = { es, en };

type Vars = Readonly<Record<string, string | number>>;

/** Replaces `{name}` placeholders. An unknown placeholder is left untouched on purpose:
 *  a visible `{days}` in a draft is easier to spot than a silently empty string. */
function interpolate(template: string, vars?: Vars): string {
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export type Translator = (key: DictionaryKey, vars?: Vars) => string;

export function useTranslations(locale: Locale): Translator {
  const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
  return (key, vars) => interpolate(dictionary[key], vars);
}

/** Formats a date in the reader's language. Dates in content are plain `Date` values. */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
