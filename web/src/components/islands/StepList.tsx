import { useEffect, useRef } from 'react';

import { useTranslations, type Locale } from '../../i18n';
import type { Step } from '../../schemas/step';
import type { TrackRef } from '../../schemas/progress';
import {
  completedSteps,
  getActiveCharacter,
  setLevel,
  setSkillLevel,
  toggleStep,
} from '../../lib/progress/store';
import { useProgress } from './useProgress';

interface Props {
  locale: Locale;
  track: TrackRef;
  steps: readonly Step[];
}

/**
 * The marking engine, reused by every long guide. Without a character the steps still
 * read perfectly; the checkbox is what needs one.
 */
export default function StepList({ locale, track, steps }: Props): React.ReactElement {
  const t = useTranslations(locale);
  const progress = useProgress();
  const character = getActiveCharacter(progress);
  const done = new Set(character === undefined ? [] : completedSteps(character, track));

  const doneCount = steps.filter((step) => done.has(step.id)).length;
  const nextStep = steps.find((step) => !done.has(step.id));
  const nextRef = useRef<HTMLLIElement>(null);
  const hasScrolled = useRef(false);

  // On arrival, take the reader to where they left off. Once only: after that they are
  // reading, and yanking the page around while they tick things would be hostile.
  useEffect(() => {
    if (hasScrolled.current || nextRef.current === null || doneCount === 0) return;
    hasScrolled.current = true;
    nextRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [doneCount]);

  const rangeLabel = (step: Step): string =>
    track.kind === 'leveling'
      ? t('progress.steps.levelRange', { from: step.from, to: step.to })
      : t('progress.steps.skillRange', { from: step.from, to: step.to });

  return (
    <div className="stack">
      <p className="summary">
        <strong>{t('progress.steps.done', { done: doneCount, total: steps.length })}</strong>
        {nextStep === undefined ? (
          <span className="muted"> · {t('progress.steps.allDone')}</span>
        ) : (
          <span className="muted">
            {' '}
            · {t('progress.steps.next')}: {nextStep.action}
          </span>
        )}
      </p>

      {character === undefined ? (
        <p className="small muted">{t('progress.steps.needCharacter')}</p>
      ) : (
        <label className="reached small">
          <span>
            {track.kind === 'leveling'
              ? t('progress.steps.characterLevel')
              : t('progress.steps.skillLevel')}
          </span>
          <input
            type="number"
            min={track.kind === 'leveling' ? 1 : 0}
            max={track.kind === 'leveling' ? 60 : 300}
            value={
              track.kind === 'leveling'
                ? character.level
                : (character.professions[track.profession]?.skillLevel ?? 0)
            }
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isNaN(value)) return;
              if (track.kind === 'leveling') {
                setLevel(value);
              } else {
                setSkillLevel(track.profession, value);
              }
            }}
          />
        </label>
      )}

      <ol className="rail">
        {steps.map((step) => {
          const isDone = done.has(step.id);
          const isNext = step.id === nextStep?.id;
          return (
            <li
              key={step.id}
              ref={isNext ? nextRef : null}
              data-done={isDone ? 'true' : 'false'}
              data-current={isNext ? 'true' : 'false'}
            >
              <div className="head">
                <input
                  type="checkbox"
                  id={`step-${step.id}`}
                  checked={isDone}
                  disabled={character === undefined}
                  onChange={() => toggleStep(track, step.id, step.to)}
                  aria-label={t('progress.steps.toggle', { action: step.action })}
                />
                <label htmlFor={`step-${step.id}`} className={isDone ? 'action struck' : 'action'}>
                  {step.action}
                </label>
                <span className="badge">{rangeLabel(step)}</span>
              </div>

              {step.materials !== undefined && (
                <p className="small muted">
                  {t('progress.steps.materials')}:{' '}
                  {step.materials
                    .map((material) => `${material.quantity}× ${material.item}`)
                    .join(', ')}
                </p>
              )}
              {step.note !== undefined && <p className="small muted">{step.note}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
