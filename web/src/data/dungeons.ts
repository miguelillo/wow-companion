import type { Locale } from '../i18n/config';

/**
 * Dungeon names for the zone pages. Never translated: the community uses the English
 * names in every language. This is a stopgap until the dungeons collection is written;
 * the keys are the ones the zone entries already point at.
 */
const DUNGEON_NAMES: Readonly<Record<string, string>> = {
  deadmines: 'Deadmines',
  'wailing-caverns': 'Wailing Caverns',
  'shadowfang-keep': 'Shadowfang Keep',
  stockade: 'The Stockade',
  gnomeregan: 'Gnomeregan',
  'razorfen-kraul': 'Razorfen Kraul',
  'scarlet-monastery': 'Scarlet Monastery',
  'razorfen-downs': 'Razorfen Downs',
  uldaman: 'Uldaman',
  'zul-farrak': "Zul'Farrak",
  maraudon: 'Maraudon',
  'sunken-temple': 'Sunken Temple',
  'blackrock-depths': 'Blackrock Depths',
  'dire-maul': 'Dire Maul',
  stratholme: 'Stratholme',
  scholomance: 'Scholomance',
  ubrs: 'Upper Blackrock Spire',
};

export function dungeonName(key: string): string {
  return DUNGEON_NAMES[key] ?? key;
}

/** Continents read differently per language; zone and dungeon names never do. */
export const continentNames: Readonly<Record<string, Readonly<Record<Locale, string>>>> = {
  'eastern-kingdoms': { es: 'Reinos del Este', en: 'Eastern Kingdoms' },
  kalimdor: { es: 'Kalimdor', en: 'Kalimdor' },
  'zephras-isle': { es: 'Isla Zephras', en: 'Zephras Isle' },
};
