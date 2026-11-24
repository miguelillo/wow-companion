import type { CharacterProgress, ProgressDocument } from '../../schemas/progress';

/**
 * Merges two progress documents. The rule is the same everywhere it is used -- importing
 * a string, and signing in later: **ticked beats unticked**. Nobody loses work they did
 * on another device, and the worst case is a step marked done that the reader redoes.
 */
export function mergeProgress(
  base: ProgressDocument,
  incoming: ProgressDocument,
): ProgressDocument {
  const characters: Record<string, CharacterProgress> = { ...base.characters };

  for (const [id, incomingCharacter] of Object.entries(incoming.characters)) {
    const existing = characters[id];
    characters[id] =
      existing === undefined ? incomingCharacter : mergeCharacter(existing, incomingCharacter);
  }

  return {
    version: 1,
    ...(base.activeCharacter !== undefined || incoming.activeCharacter !== undefined
      ? { activeCharacter: base.activeCharacter ?? incoming.activeCharacter }
      : {}),
    characters,
  };
}

function mergeCharacter(base: CharacterProgress, incoming: CharacterProgress): CharacterProgress {
  const professionKeys = new Set([
    ...Object.keys(base.professions),
    ...Object.keys(incoming.professions),
  ]);

  const professions: CharacterProgress['professions'] = {};
  for (const key of professionKeys) {
    const left = base.professions[key];
    const right = incoming.professions[key];
    professions[key] = {
      skillLevel: Math.max(left?.skillLevel ?? 0, right?.skillLevel ?? 0),
      completedSteps: union(left?.completedSteps, right?.completedSteps),
    };
  }

  const newer = incoming.updatedAt > base.updatedAt ? incoming : base;

  return {
    // Name, realm and class come from the newer record; the rest takes the best of both.
    name: newer.name,
    realm: newer.realm,
    class: newer.class,
    faction: newer.faction,
    level: Math.max(base.level, incoming.level),
    professions,
    leveling: {
      completedSteps: union(base.leveling.completedSteps, incoming.leveling.completedSteps),
    },
    updatedAt: newer.updatedAt,
  };
}

function union(left: readonly string[] = [], right: readonly string[] = []): string[] {
  return [...new Set([...left, ...right])].sort();
}
