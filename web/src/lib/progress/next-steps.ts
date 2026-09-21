import type { Step } from '../../schemas/step';
import type { CharacterProgress, TrackRef } from '../../schemas/progress';
import { completedSteps } from './store';

export interface Track {
  readonly ref: TrackRef;
  /** Displayed name of the ladder: 'Alquimia', 'Ruta de leveleo'… */
  readonly label: string;
  readonly steps: readonly Step[];
  /** Where the reader goes to work on it. */
  readonly href: string;
}

export interface NextStep {
  readonly track: Track;
  readonly step: Step;
  /** False when the step is above the character's current level or skill. */
  readonly actionable: boolean;
  readonly remaining: number;
}

/**
 * The two or three things this character should do now: the first unticked step of every
 * ladder they are on.
 *
 * Order is "what you can actually do first": steps already within reach come before ones
 * that need more level or skill, leveling before professions, then by name so the list
 * does not shuffle between renders. If more than `limit` qualify we show the first ones
 * and say nothing about the rest -- the whole point is not having to choose.
 */
export function computeNextSteps(
  character: CharacterProgress,
  tracks: readonly Track[],
  limit = 3,
): NextStep[] {
  const candidates: NextStep[] = [];

  for (const track of tracks) {
    const done = new Set(completedSteps(character, track.ref));
    const pending = track.steps.filter((step) => !done.has(step.id));
    const step = pending[0];
    if (step === undefined) continue;

    const reached =
      track.ref.kind === 'leveling'
        ? character.level
        : (character.professions[track.ref.profession]?.skillLevel ?? 0);

    candidates.push({ track, step, actionable: step.from <= reached, remaining: pending.length });
  }

  candidates.sort((left, right) => {
    if (left.actionable !== right.actionable) return left.actionable ? -1 : 1;
    if (left.track.ref.kind !== right.track.ref.kind) {
      return left.track.ref.kind === 'leveling' ? -1 : 1;
    }
    return left.track.label.localeCompare(right.track.label);
  });

  return candidates.slice(0, limit);
}

/** Percentage of a ladder already ticked, rounded down; 0 when there is nothing to do. */
export function trackProgress(character: CharacterProgress, track: Track): number {
  if (track.steps.length === 0) return 0;
  const done = new Set(completedSteps(character, track.ref));
  const ticked = track.steps.filter((step) => done.has(step.id)).length;
  return Math.floor((ticked / track.steps.length) * 100);
}
