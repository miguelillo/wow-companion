import { z } from 'zod';

export const localeSchema = z.enum(['es', 'en']);
export type Locale = z.infer<typeof localeSchema>;

/**
 * Lowercase kebab-case identifier. Keys are never translated: they are the contract
 * between the content, the stored progress and the addon.
 */
export const keySchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case');

export const factionSchema = z.enum(['alliance', 'horde', 'both']);
export const playableFactionSchema = z.enum(['alliance', 'horde']);
export const continentSchema = z.enum(['eastern-kingdoms', 'kalimdor', 'zephras-isle']);
export const roleSchema = z.enum(['tank', 'healer', 'melee-dps', 'ranged-dps']);

/**
 * Stable step id, e.g. `prof-alchemy-012` or `lvl-alliance-104`. Ids are never reused:
 * a rewritten step gets a new one, so stored progress never points at the wrong thing.
 */
export const stepIdSchema = z
  .string()
  .regex(/^(prof|lvl)-[a-z0-9]+(?:-[a-z0-9]+)*-\d{3}$/, 'e.g. prof-alchemy-012');

/** In-game position: percentage of the zone, the way WoW reports coordinates. */
export const placeSchema = z.object({
  /** Zone key, English, never translated. */
  zone: keySchema,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const materialSchema = z.object({
  /** English item name. The displayed label comes from the interface dictionary. */
  item: z.string().min(1),
  quantity: z.number().int().positive(),
  /** Filled in from Blizzard game data once a namespace for Forever exists. */
  itemId: z.number().int().positive().optional(),
});

export const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

/** ISO 8601 string rather than Date: this value crosses JSON, Lua and C#. */
export const isoDateTimeSchema = z.iso.datetime();

export type Place = z.infer<typeof placeSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Source = z.infer<typeof sourceSchema>;
