import { useState } from 'react';

import { useTranslations, type Locale } from '../../i18n';
import type { Step } from '../../schemas/step';
import StepList from './StepList';

export interface RouteSegment {
  readonly from: number;
  readonly to: number;
  readonly zones: readonly { readonly name: string; readonly href: string }[];
  readonly dungeons: readonly string[];
  readonly steps: readonly Step[];
}

export interface FactionRoute {
  readonly faction: 'alliance' | 'horde';
  readonly segments: readonly RouteSegment[];
}

interface Props {
  locale: Locale;
  routes: readonly FactionRoute[];
  initialLevel?: number;
}

/**
 * A level control from 1 to 60 that answers one question: where do I go now. The whole
 * route sits underneath with the current band picked out, and touching a band moves the
 * level to it, so the control works in both directions.
 */
export default function RoutePicker({
  locale,
  routes,
  initialLevel = 1,
}: Props): React.ReactElement {
  const t = useTranslations(locale);
  const [faction, setFaction] = useState<'alliance' | 'horde'>('alliance');
  const [level, setLevel] = useState(initialLevel);

  const route = routes.find((entry) => entry.faction === faction) ?? routes[0];
  const segments = route?.segments ?? [];
  const current =
    segments.find((segment) => level >= segment.from && level < segment.to) ?? segments.at(-1);

  return (
    <div className="stack">
      <div className="row" role="group" aria-label={t('progress.character.faction')}>
        {(['alliance', 'horde'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={option === faction ? 'chip chip-active' : 'chip'}
            aria-pressed={option === faction}
            onClick={() => setFaction(option)}
          >
            {t(`progress.faction.${option}`)}
          </button>
        ))}
      </div>

      <label className="stack level-control">
        <span>
          {t('leveling.atLevel')} <strong className="level">{level}</strong>
        </span>
        <input
          type="range"
          min={1}
          max={60}
          value={level}
          onChange={(event) => setLevel(Number(event.target.value))}
        />
      </label>

      {current !== undefined && (
        <p className="now">
          <span className="muted small">{t('leveling.goTo')} </span>
          {current.zones.length === 0 ? (
            <strong>{t('leveling.startingZone')}</strong>
          ) : (
            current.zones.map((zone, index) => (
              <span key={zone.href}>
                {index > 0 && <span className="muted">, </span>}
                <a href={zone.href}>{zone.name}</a>
              </span>
            ))
          )}
        </p>
      )}

      <ol className="bands">
        {segments.map((segment) => {
          const isCurrent = segment === current;
          return (
            <li key={`${segment.from}-${segment.to}`} data-current={isCurrent ? 'true' : 'false'}>
              <button type="button" onClick={() => setLevel(segment.from)}>
                <span className="level">
                  {segment.from}–{segment.to}
                </span>
                <span>
                  {segment.zones.length === 0
                    ? t('leveling.startingZone')
                    : segment.zones.map((zone) => zone.name).join(', ')}
                </span>
                {segment.dungeons.length > 0 && (
                  <span className="small muted">{segment.dungeons.join(' · ')}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {route !== undefined && (
        <section className="stack" aria-label={t('leveling.steps')}>
          <h3>{t('leveling.steps')}</h3>
          <StepList
            locale={locale}
            track={{ kind: 'leveling' }}
            steps={route.segments.flatMap((segment) => segment.steps)}
          />
        </section>
      )}
    </div>
  );
}
