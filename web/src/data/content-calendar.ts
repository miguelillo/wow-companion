import type { Locale } from '../i18n/config';
import { gameDates } from './game-dates';

export type ContentStatus = 'open' | 'dated' | 'undated';

export interface ContentCalendarEntry {
  /** Never translated: also the anchor id on the status page. */
  readonly key: string;
  readonly name: Readonly<Record<Locale, string>>;
  readonly detail: Readonly<Record<Locale, string>>;
  /** Null when Blizzard has not given a date. */
  readonly opensAt: Date | null;
  /** False while the information is beta-only. */
  readonly confirmed: boolean;
}

/**
 * What is open and what is still to come. Only announced content goes in here: an entry
 * with no date shows as undated rather than being guessed at.
 */
export const contentCalendar: readonly ContentCalendarEntry[] = [
  {
    key: 'beta',
    name: { es: 'Beta abierta', en: 'Open beta' },
    detail: {
      es: 'Incluida con el Skyborne Epic Pack y superiores; el Heroic no la trae.',
      en: 'Included with the Skyborne Epic Pack and above; the Heroic pack does not carry it.',
    },
    opensAt: gameDates.betaStart,
    confirmed: true,
  },
  {
    key: 'launch',
    name: { es: 'Lanzamiento', en: 'Launch' },
    detail: {
      es: 'Nivel máximo 60, congelado de forma indefinida.',
      en: 'Level cap 60, frozen indefinitely.',
    },
    opensAt: gameDates.launch,
    confirmed: true,
  },
  {
    key: 'dungeons',
    name: { es: 'Nueve mazmorras', en: 'Nine dungeons' },
    detail: {
      es: 'Disponibles desde el primer día.',
      en: 'Available from day one.',
    },
    opensAt: gameDates.launch,
    confirmed: true,
  },
  {
    key: 'raids',
    name: { es: 'Dos raids', en: 'Two raids' },
    detail: {
      es: 'Anunciadas para el lanzamiento; no sabemos si abren las dos el mismo día.',
      en: 'Announced for launch; whether both open on the same day is not stated.',
    },
    opensAt: gameDates.launch,
    confirmed: false,
  },
  {
    key: 'battleground',
    name: { es: 'Campo de batalla 15v15', en: '15v15 battleground' },
    detail: {
      es: 'En las Islas Lanza Oscura.',
      en: 'In the Darkspear Islands.',
    },
    opensAt: gameDates.launch,
    confirmed: true,
  },
  {
    key: 'camping',
    name: { es: 'Sistema de acampada', en: 'Camp system' },
    detail: {
      es: 'Compartir buffs en mundo abierto.',
      en: 'Shared buffs out in the world.',
    },
    opensAt: gameDates.launch,
    confirmed: true,
  },
];

export function contentStatus(entry: ContentCalendarEntry, now: Date = new Date()): ContentStatus {
  if (entry.opensAt === null) return 'undated';
  return entry.opensAt.getTime() <= now.getTime() ? 'open' : 'dated';
}
