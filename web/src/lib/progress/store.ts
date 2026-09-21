import {
  characterId,
  emptyProgressDocument,
  type CharacterProgress,
  type ProgressDocument,
  type TrackRef,
} from '../../schemas/progress';
import { exportProgress, importProgress } from './codec';
import { mergeProgress } from './merge';
import { loadProgress, saveProgress, STORAGE_KEY } from './storage';

/**
 * One store for the whole page, so the character picker, the step lists and the next
 * steps panel never disagree. Deliberately about fifty lines instead of a state library:
 * it is a value, a set of listeners and a write to local storage.
 */
type Listener = () => void;

const EMPTY: ProgressDocument = Object.freeze(emptyProgressDocument());

let current: ProgressDocument | null = null;
let lastWriteFailed = false;
const listeners = new Set<Listener>();

function ensure(): ProgressDocument {
  current ??= loadProgress();
  return current;
}

function commit(next: ProgressDocument): void {
  current = next;
  lastWriteFailed = !saveProgress(next);
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): ProgressDocument {
  return ensure();
}

/** Islands render on the server at build time, where there is no stored progress. */
export function getServerSnapshot(): ProgressDocument {
  return EMPTY;
}

export function hasStorageProblem(): boolean {
  return lastWriteFailed;
}

/** Another tab changed the progress: adopt it rather than fight over the key. */
export function startCrossTabSync(): () => void {
  const onStorage = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    current = loadProgress();
    for (const listener of listeners) listener();
  };

  globalThis.addEventListener?.('storage', onStorage);
  return () => globalThis.removeEventListener?.('storage', onStorage);
}

// Actions -------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

export function getActiveCharacter(document: ProgressDocument): CharacterProgress | undefined {
  return document.activeCharacter === undefined
    ? undefined
    : document.characters[document.activeCharacter];
}

export interface NewCharacter {
  readonly name: string;
  readonly realm: string;
  readonly class: string;
  readonly level: number;
}

export function addCharacter(character: NewCharacter): string {
  const id = characterId(character.name, character.realm);
  const document = ensure();

  commit({
    ...document,
    activeCharacter: id,
    characters: {
      ...document.characters,
      [id]: {
        name: character.name,
        realm: character.realm,
        class: character.class,
        level: character.level,
        professions: document.characters[id]?.professions ?? {},
        leveling: document.characters[id]?.leveling ?? { completedSteps: [] },
        updatedAt: nowIso(),
      },
    },
  });

  return id;
}

export function setActiveCharacter(id: string): void {
  const document = ensure();
  if (document.characters[id] === undefined) return;
  commit({ ...document, activeCharacter: id });
}

export function removeCharacter(id: string): void {
  const document = ensure();
  const characters = { ...document.characters };
  delete characters[id];

  const remaining = Object.keys(characters);
  const nextActive = document.activeCharacter === id ? remaining[0] : document.activeCharacter;

  commit({
    version: 1,
    ...(nextActive === undefined ? {} : { activeCharacter: nextActive }),
    characters,
  });
}

function updateActive(change: (character: CharacterProgress) => CharacterProgress): void {
  const document = ensure();
  const id = document.activeCharacter;
  const character = id === undefined ? undefined : document.characters[id];
  if (id === undefined || character === undefined) return;

  commit({
    ...document,
    characters: { ...document.characters, [id]: { ...change(character), updatedAt: nowIso() } },
  });
}

export function setLevel(level: number): void {
  updateActive((character) => ({ ...character, level }));
}

export function setSkillLevel(profession: string, skillLevel: number): void {
  updateActive((character) => ({
    ...character,
    professions: {
      ...character.professions,
      [profession]: {
        skillLevel,
        completedSteps: character.professions[profession]?.completedSteps ?? [],
      },
    },
  }));
}

export function completedSteps(character: CharacterProgress, track: TrackRef): readonly string[] {
  return track.kind === 'leveling'
    ? character.leveling.completedSteps
    : (character.professions[track.profession]?.completedSteps ?? []);
}

/**
 * `reachedSkill` is the skill a profession step leaves you at. Ticking one raises the
 * stored skill to it when it is behind, and never lowers it: crafting up to 110 does make
 * you 110, but re-ticking an old step should not undo what you have since gained.
 * Character level stays manual, because a reader can outlevel or skip a zone.
 */
export function toggleStep(track: TrackRef, stepId: string, reachedSkill?: number): void {
  updateActive((character) => {
    const done = new Set(completedSteps(character, track));
    if (done.has(stepId)) {
      done.delete(stepId);
    } else {
      done.add(stepId);
    }
    const next = [...done].sort();

    if (track.kind === 'leveling') {
      return { ...character, leveling: { completedSteps: next } };
    }

    const currentSkill = character.professions[track.profession]?.skillLevel ?? 0;
    const ticked = done.has(stepId);

    return {
      ...character,
      professions: {
        ...character.professions,
        [track.profession]: {
          skillLevel:
            ticked && reachedSkill !== undefined
              ? Math.min(300, Math.max(currentSkill, reachedSkill))
              : currentSkill,
          completedSteps: next,
        },
      },
    };
  });
}

// Transfer ------------------------------------------------------------------

export function exportToString(): Promise<string> {
  return exportProgress(ensure());
}

/** Imported progress is merged, never pasted over: ticked beats unticked. */
export async function importFromString(text: string): Promise<boolean> {
  const incoming = await importProgress(text);
  if (incoming === null) return false;

  commit(mergeProgress(ensure(), incoming));
  return true;
}
