import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { exportProgress, importProgress } from '../src/lib/progress/codec';
import { mergeProgress } from '../src/lib/progress/merge';
import { computeNextSteps, trackProgress, type Track } from '../src/lib/progress/next-steps';
import {
  characterId,
  type CharacterProgress,
  type ProgressDocument,
} from '../src/schemas/progress';
import type { Step } from '../src/schemas/step';

function character(overrides: Partial<CharacterProgress> = {}): CharacterProgress {
  return {
    name: 'Kaelin',
    realm: 'Sulfuron',
    class: 'priest',
    faction: 'alliance',
    level: 12,
    professions: {},
    leveling: { completedSteps: [] },
    updatedAt: '2026-09-20T10:00:00Z',
    ...overrides,
  };
}

function document(characters: Record<string, CharacterProgress>): ProgressDocument {
  const first = Object.keys(characters)[0];
  return {
    version: 1,
    ...(first === undefined ? {} : { activeCharacter: first }),
    characters,
  };
}

const steps: Step[] = [
  { id: 'prof-alchemy-001', from: 1, to: 60, action: 'Minor Healing Potion x30' },
  { id: 'prof-alchemy-002', from: 60, to: 110, action: 'Lesser Healing Potion x25' },
  { id: 'prof-alchemy-003', from: 110, to: 140, action: 'Healing Potion x20' },
];

describe('characterId', () => {
  it('normalises accents and case so one character has one key', () => {
    assert.equal(characterId('Ménalo', 'Lanza Oscura'), 'menalo-lanza-oscura');
  });
});

describe('mergeProgress', () => {
  it('keeps a step ticked when either side ticked it', () => {
    const id = 'kaelin-sulfuron';
    const local = document({
      [id]: character({
        professions: { alchemy: { skillLevel: 60, completedSteps: ['prof-alchemy-001'] } },
      }),
    });
    const remote = document({
      [id]: character({
        professions: { alchemy: { skillLevel: 40, completedSteps: ['prof-alchemy-002'] } },
        updatedAt: '2026-09-21T10:00:00Z',
      }),
    });

    const merged = mergeProgress(local, remote);

    assert.deepEqual(merged.characters[id]?.professions['alchemy']?.completedSteps, [
      'prof-alchemy-001',
      'prof-alchemy-002',
    ]);
  });

  it('takes the highest level and skill from either side', () => {
    const id = 'kaelin-sulfuron';
    const merged = mergeProgress(
      document({
        [id]: character({
          level: 24,
          professions: { alchemy: { skillLevel: 120, completedSteps: [] } },
        }),
      }),
      document({
        [id]: character({
          level: 18,
          professions: { alchemy: { skillLevel: 150, completedSteps: [] } },
        }),
      }),
    );

    assert.equal(merged.characters[id]?.level, 24);
    assert.equal(merged.characters[id]?.professions['alchemy']?.skillLevel, 150);
  });

  it('brings across characters the other side has never seen', () => {
    const merged = mergeProgress(
      document({ 'kaelin-sulfuron': character() }),
      document({ 'brannor-golemagg': character({ name: 'Brannor', realm: 'Golemagg' }) }),
    );

    assert.deepEqual(Object.keys(merged.characters).sort(), [
      'brannor-golemagg',
      'kaelin-sulfuron',
    ]);
  });

  it('merges leveling steps as well as profession steps', () => {
    const id = 'kaelin-sulfuron';
    const merged = mergeProgress(
      document({ [id]: character({ leveling: { completedSteps: ['lvl-alliance-001'] } }) }),
      document({ [id]: character({ leveling: { completedSteps: ['lvl-alliance-002'] } }) }),
    );

    assert.deepEqual(merged.characters[id]?.leveling.completedSteps, [
      'lvl-alliance-001',
      'lvl-alliance-002',
    ]);
  });
});

describe('export and import', () => {
  it('round-trips a document through the transfer string', async () => {
    const original = document({
      'kaelin-sulfuron': character({ leveling: { completedSteps: ['lvl-alliance-001'] } }),
    });

    const text = await exportProgress(original);
    assert.ok(text.startsWith('WCP1'));

    const restored = await importProgress(text);
    assert.deepEqual(restored, original);
  });

  it('survives whitespace and line breaks from a careless paste', async () => {
    const original = document({ 'kaelin-sulfuron': character() });
    const text = await exportProgress(original);

    const restored = await importProgress(`  ${text.slice(0, 20)}\n${text.slice(20)}  `);
    assert.deepEqual(restored, original);
  });

  it('returns null for anything that is not one of our strings', async () => {
    assert.equal(await importProgress('hello'), null);
    assert.equal(await importProgress(''), null);
    assert.equal(await importProgress('WCP1:not-valid-base64!!'), null);
  });

  it('rejects a string that decodes to the wrong shape', async () => {
    const bogus = `WCP1U:${Buffer.from(JSON.stringify({ version: 9 })).toString('base64')}`;
    assert.equal(await importProgress(bogus), null);
  });
});

describe('computeNextSteps', () => {
  const tracks: Track[] = [
    {
      ref: { kind: 'profession', profession: 'alchemy' },
      label: 'Alquimia',
      steps,
      href: '/profesiones/alquimia',
    },
    {
      ref: { kind: 'leveling' },
      label: 'Ruta de leveleo',
      steps: [{ id: 'lvl-alliance-001', from: 1, to: 10, action: 'Zona inicial' }],
      href: '/leveleo',
    },
  ];

  it('returns the first unticked step of every ladder', () => {
    const next = computeNextSteps(
      character({
        professions: { alchemy: { skillLevel: 60, completedSteps: ['prof-alchemy-001'] } },
      }),
      tracks,
    );

    const alchemy = next.find((entry) => entry.track.label === 'Alquimia');
    assert.equal(alchemy?.step.id, 'prof-alchemy-002');
  });

  it('puts what you can do now before what needs more skill', () => {
    const next = computeNextSteps(
      character({ level: 1, professions: { alchemy: { skillLevel: 0, completedSteps: [] } } }),
      [
        {
          ...tracks[0]!,
          steps: [{ id: 'prof-alchemy-009', from: 200, to: 210, action: 'Muy lejos' }],
        },
        tracks[1]!,
      ],
    );

    assert.equal(next[0]?.track.ref.kind, 'leveling');
    assert.equal(next[0]?.actionable, true);
    assert.equal(next[1]?.actionable, false);
  });

  it('never returns more than three things', () => {
    const keys = ['alchemy', 'mining', 'tailoring', 'cooking', 'fishing'];
    const many: Track[] = keys.map((key) => ({
      ref: { kind: 'profession', profession: key },
      label: key,
      steps,
      href: `/profesiones/${key}`,
    }));
    const onAllOfThem = character({
      professions: Object.fromEntries(
        keys.map((key) => [key, { skillLevel: 0, completedSteps: [] }]),
      ),
    });

    assert.equal(computeNextSteps(onAllOfThem, many).length, 3);
  });

  it('ignores a profession the character has never touched', () => {
    // Otherwise a fresh character is told to level all twelve professions at once.
    const next = computeNextSteps(character(), tracks);

    assert.deepEqual(
      next.map((entry) => entry.track.ref.kind),
      ['leveling'],
    );
  });

  it('skips a ladder that is finished', () => {
    const next = computeNextSteps(
      character({
        professions: {
          alchemy: { skillLevel: 140, completedSteps: steps.map((step) => step.id) },
        },
      }),
      [tracks[0]!],
    );

    assert.deepEqual(next, []);
  });

  it('counts a profession as started once a skill level is recorded', () => {
    const next = computeNextSteps(
      character({ professions: { alchemy: { skillLevel: 5, completedSteps: [] } } }),
      [tracks[0]!],
    );

    assert.equal(next[0]?.step.id, 'prof-alchemy-001');
  });
});

describe('trackProgress', () => {
  it('reports the percentage ticked', () => {
    const track = tracksFixture();
    assert.equal(trackProgress(character(), track), 0);
    assert.equal(
      trackProgress(
        character({
          professions: { alchemy: { skillLevel: 60, completedSteps: ['prof-alchemy-001'] } },
        }),
        track,
      ),
      33,
    );
  });

  function tracksFixture(): Track {
    return {
      ref: { kind: 'profession', profession: 'alchemy' },
      label: 'Alquimia',
      steps,
      href: '/profesiones/alquimia',
    };
  }
});
