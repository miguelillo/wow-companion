import { useTranslations, type Locale } from '../../i18n';
import { computeNextSteps, type Track } from '../../lib/progress/next-steps';
import { getActiveCharacter } from '../../lib/progress/store';
import { useProgress } from './useProgress';

interface Props {
  locale: Locale;
  tracks: readonly Track[];
  /** Where to send a reader with no character yet. */
  characterHref: string;
}

/**
 * The personal half of the home page, and the header of every long guide. At most three
 * things: if more qualify we pick and say nothing about the rest, because the point is
 * not having to choose. With no character the slot invites rather than sitting empty.
 */
export default function NextSteps({ locale, tracks, characterHref }: Props): React.ReactElement {
  const t = useTranslations(locale);
  const progress = useProgress();
  const character = getActiveCharacter(progress);

  if (character === undefined) {
    return (
      <div className="stack">
        <p>{t('home.next.empty')}</p>
        <p>
          <a className="button" href={characterHref}>
            {t('home.next.emptyCta')}
          </a>
        </p>
      </div>
    );
  }

  if (tracks.length === 0) {
    // No ladders published yet: say so rather than claim the reader has finished.
    return <p className="muted">{t('home.next.soon')}</p>;
  }

  const next = computeNextSteps(character, tracks);

  if (next.length === 0) {
    const started = tracks.some(
      (track) =>
        track.ref.kind !== 'profession' ||
        character.professions[track.ref.profession] !== undefined,
    );
    return (
      <p className="muted">
        {started ? t('progress.steps.allDone') : t('progress.next.noneStarted')}
      </p>
    );
  }

  return (
    <ul className="next">
      {next.map((entry) => (
        <li key={`${entry.track.label}-${entry.step.id}`}>
          <p className="small muted">
            <a href={entry.track.href}>{entry.track.label}</a> ·{' '}
            {t('progress.next.remaining', { count: entry.remaining })}
          </p>
          <p className="action">{entry.step.action}</p>
          {entry.step.materials !== undefined && (
            <p className="small muted">
              {t('progress.steps.materials')}:{' '}
              {entry.step.materials
                .map((material) => `${material.quantity}× ${material.item}`)
                .join(', ')}
            </p>
          )}
          {!entry.actionable && <p className="small warn">{t('progress.next.blocked')}</p>}
        </li>
      ))}
    </ul>
  );
}
