import { z } from 'zod';
import { materialSchema, pathSchema, placeSchema, stepIdSchema } from './primitives';

/**
 * One actionable step of a long guide. Half of the contract with the addon and the
 * desktop client: change it here and regenerate shared/contracts.
 */
export const stepSchema = z
  .object({
    id: stepIdSchema,
    /** Level range for leveling steps, skill-point range for professions. */
    from: z.number().int().min(1),
    to: z.number().int().min(1),
    action: z.string().min(1),
    materials: z.array(materialSchema).min(1).optional(),
    note: z.string().optional(),
    /** Fill this in for every step that happens somewhere concrete, from day one. */
    place: placeSchema.optional(),
    /** Fill this in where the straight line lies: around water, cliffs and mountains. */
    path: pathSchema.optional(),
  })
  .refine((step) => step.to >= step.from, {
    message: 'to must be greater than or equal to from',
    path: ['to'],
  });

export type Step = z.infer<typeof stepSchema>;

export const stepListSchema = z
  .array(stepSchema)
  .refine((steps) => new Set(steps.map((step) => step.id)).size === steps.length, {
    message: 'step ids must be unique within a guide',
  });
