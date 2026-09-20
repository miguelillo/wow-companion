import { z } from 'zod';
import { isoDateTimeSchema } from '../schemas/primitives';

/**
 * Shape of our own `/api/realm-status` endpoint, which caches Blizzard's realm and
 * connected-realm data for a few minutes. Defined here because the browser validates
 * what it receives before drawing the card.
 */
export const realmSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  region: z.string().min(1),
  online: z.boolean(),
  /** Null when Blizzard does not report it for this realm. */
  population: z.enum(['low', 'medium', 'high', 'full']).nullable(),
  hasQueue: z.boolean(),
});

export const realmStatusSchema = z.object({
  updatedAt: isoDateTimeSchema,
  realms: z.array(realmSchema),
});

export type Realm = z.infer<typeof realmSchema>;
export type RealmStatus = z.infer<typeof realmStatusSchema>;
