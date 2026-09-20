import { z } from 'zod';
import {
  continentSchema,
  factionSchema,
  keySchema,
  localeSchema,
  playableFactionSchema,
  roleSchema,
  sourceSchema,
} from './primitives';
import { stepListSchema } from './step';

/**
 * Fields every localized entry carries.
 *
 * `translationKey` is identical across languages and doubles as the identifier used by
 * stored progress and the addon. `slug` is the URL segment for this language: translated
 * for professions and free guides, kept in English for zones, dungeons and classes,
 * because the community uses the English names in both languages.
 *
 * `confirmed` defaults to false on purpose. While Forever is in beta nothing is confirmed
 * until someone confirms it, and unconfirmed entries show a badge.
 */
const localizedFields = {
  lang: localeSchema,
  translationKey: keySchema,
  slug: keySchema,
  /** Written per page, never templated: this is the <title>. */
  title: z.string().min(10).max(70),
  /** Written per page, never templated: this is the meta description. */
  description: z.string().min(50).max(160),
  updated: z.coerce.date(),
  confirmed: z.boolean().default(false),
  sources: z.array(sourceSchema).default([]),
  draft: z.boolean().default(false),
};

const levelRange = {
  minLevel: z.number().int().min(1).max(60),
  maxLevel: z.number().int().min(1).max(60),
};

const rangeIsOrdered = <T extends { minLevel: number; maxLevel: number }>(value: T) =>
  value.maxLevel >= value.minLevel;
const rangeError = { message: 'maxLevel must be >= minLevel', path: ['maxLevel'] };

export const zoneSchema = z
  .object({
    ...localizedFields,
    /** English, never translated: 'Westfall'. */
    name: z.string().min(1),
    faction: factionSchema,
    ...levelRange,
    continent: continentSchema,
    /** Dungeon translationKeys. */
    nearbyDungeons: z.array(keySchema).default([]),
  })
  .refine(rangeIsOrdered, rangeError);

export const professionSchema = z.object({
  ...localizedFields,
  /** Displayed name, translated: 'Alquimia'. */
  name: z.string().min(1),
  kind: z.enum(['gathering', 'crafting', 'secondary']),
  /** Profession translationKeys this one pairs well with. */
  pairsWith: z.array(keySchema).default([]),
  summary: z.string().min(1),
  /** The 1–300 ladder. Ranges are skill points, not levels. */
  steps: stepListSchema,
});

export const dungeonSchema = z
  .object({
    ...localizedFields,
    /** English, never translated: 'Deadmines'. */
    name: z.string().min(1),
    ...levelRange,
    /** Zone translationKey the entrance sits in. */
    location: keySchema,
    groupSize: z.number().int().min(2).max(40),
  })
  .refine(rangeIsOrdered, rangeError);

export const classSchema = z.object({
  ...localizedFields,
  name: z.string().min(1),
  roles: z.array(roleSchema).min(1),
  factions: z.array(factionSchema).min(1),
  races: z.array(keySchema).min(1),
  weapons: z.array(z.string().min(1)).min(1),
  levelingTip: z.string().min(1),
});

/**
 * The 1–60 route. It lives on its own because it is a sequence that spans zones and has
 * to be exported to a Lua table for the addon; neither zones nor free guides can hold it.
 */
export const levelingRouteSchema = z.object({
  ...localizedFields,
  faction: playableFactionSchema,
  segments: z
    .array(
      z.object({
        from: z.number().int().min(1).max(60),
        to: z.number().int().min(1).max(60),
        /** Zone translationKeys, in the order the route visits them. */
        zones: z.array(keySchema).min(1),
        dungeons: z.array(keySchema).default([]),
        steps: stepListSchema,
      }),
    )
    .min(1),
});

/** News. Summarised in our own words; `source` points at the official note we read. */
export const patchSchema = z.object({
  lang: localeSchema,
  translationKey: keySchema,
  slug: keySchema,
  title: z.string().min(10).max(90),
  description: z.string().min(50).max(160),
  date: z.coerce.date(),
  source: z.url(),
  sourceLabel: z.string().min(1),
  summary: z.string().min(1),
  draft: z.boolean().default(false),
});

/** Free-form MDX pages: gold, getting started, raids and whatever comes next. */
export const guideSchema = z.object({
  ...localizedFields,
  section: z.enum(['gold', 'start', 'raids', 'misc']),
  steps: stepListSchema.optional(),
});
