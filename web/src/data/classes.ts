import type { Locale } from '../i18n/config';

/**
 * Classes for the character picker. Keys are never translated: they are what stored
 * progress and the addon use. When the `classes` collection is written this list can be
 * read from it instead, but the picker should not wait for the guides.
 */
export interface PlayableClass {
  readonly key: string;
  readonly name: Readonly<Record<Locale, string>>;
}

export const playableClasses: readonly PlayableClass[] = [
  { key: 'warrior', name: { es: 'Guerrero', en: 'Warrior' } },
  { key: 'paladin', name: { es: 'Paladín', en: 'Paladin' } },
  { key: 'hunter', name: { es: 'Cazador', en: 'Hunter' } },
  { key: 'rogue', name: { es: 'Pícaro', en: 'Rogue' } },
  { key: 'priest', name: { es: 'Sacerdote', en: 'Priest' } },
  { key: 'shaman', name: { es: 'Chamán', en: 'Shaman' } },
  { key: 'mage', name: { es: 'Mago', en: 'Mage' } },
  { key: 'warlock', name: { es: 'Brujo', en: 'Warlock' } },
  { key: 'druid', name: { es: 'Druida', en: 'Druid' } },
];

export function classNameFor(key: string, locale: Locale): string {
  return playableClasses.find((entry) => entry.key === key)?.name[locale] ?? key;
}
