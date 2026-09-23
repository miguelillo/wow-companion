import { z } from 'zod';
import { isoDateTimeSchema, keySchema, playableFactionSchema, stepIdSchema } from './primitives';

export const professionProgressSchema = z.object({
  skillLevel: z.number().int().min(0).max(300),
  completedSteps: z.array(stepIdSchema),
});

export const levelingProgressSchema = z.object({
  completedSteps: z.array(stepIdSchema),
});

export const characterProgressSchema = z.object({
  name: z.string().min(2).max(12),
  realm: z.string().min(1),
  /** Class key, never translated: 'warrior', 'priest'… */
  class: keySchema,
  /** Which 1–60 route applies. Defaults so documents written before this still parse. */
  faction: playableFactionSchema.default('alliance'),
  level: z.number().int().min(1).max(60),
  /** Keyed by profession translationKey: 'alchemy', 'blacksmithing'… */
  professions: z.record(keySchema, professionProgressSchema).default({}),
  /**
   * The leveling route is a ladder like a profession, but it is not one, so its ticked
   * steps live on their own. Optional with a default: documents written before this
   * field existed still parse.
   */
  leveling: levelingProgressSchema.default({ completedSteps: [] }),
  updatedAt: isoDateTimeSchema,
});

export type CharacterProgress = z.infer<typeof characterProgressSchema>;
export type ProfessionProgress = z.infer<typeof professionProgressSchema>;
export type LevelingProgress = z.infer<typeof levelingProgressSchema>;

/**
 * Which ladder a step belongs to. The two are tracked separately but behave the same,
 * so every component takes one of these rather than special-casing professions.
 */
export type TrackRef =
  { readonly kind: 'profession'; readonly profession: string } | { readonly kind: 'leveling' };

export function trackKey(track: TrackRef): string {
  return track.kind === 'leveling' ? 'leveling' : `profession:${track.profession}`;
}

/** `name-realm`, lowercased: the key in local storage and in the character picker. */
export const characterIdSchema = keySchema;

export function characterId(name: string, realm: string): string {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return `${normalize(name)}-${normalize(realm)}`;
}

/**
 * What local storage holds, what the export string carries and what the addon
 * round-trips. `version` is bumped only for breaking changes, with a migration.
 */
export const progressDocumentSchema = z.object({
  version: z.literal(1),
  activeCharacter: characterIdSchema.optional(),
  characters: z.record(characterIdSchema, characterProgressSchema).default({}),
});

export type ProgressDocument = z.infer<typeof progressDocumentSchema>;

export const emptyProgressDocument = (): ProgressDocument => ({ version: 1, characters: {} });
