import { useState } from 'react';

import { playableClasses } from '../../data/classes';
import { useTranslations, type Locale } from '../../i18n';
import type { DictionaryKey } from '../../i18n';

interface Props {
  locale: Locale;
  /** Display names by profession key, since an island cannot read the collection. */
  names: Readonly<Record<string, string>>;
}

type Goal = 'gold' | 'self' | 'raid';

/** Armour type decides what "self-sufficient" means for a class. */
const ARMOUR: Readonly<Record<string, 'cloth' | 'leather' | 'mail' | 'plate'>> = {
  mage: 'cloth',
  warlock: 'cloth',
  priest: 'cloth',
  rogue: 'leather',
  druid: 'leather',
  hunter: 'mail',
  shaman: 'mail',
  warrior: 'plate',
  paladin: 'plate',
};

interface Recommendation {
  readonly pair: readonly [string, string];
  readonly reason: DictionaryKey;
}

function recommend(className: string, goal: Goal): Recommendation {
  if (goal === 'gold') {
    return { pair: ['herbalism', 'mining'], reason: 'planner.reason.gold' };
  }
  if (goal === 'raid') {
    return { pair: ['herbalism', 'alchemy'], reason: 'planner.reason.raid' };
  }

  switch (ARMOUR[className]) {
    case 'cloth':
      return { pair: ['tailoring', 'enchanting'], reason: 'planner.reason.cloth' };
    case 'plate':
      return { pair: ['mining', 'blacksmithing'], reason: 'planner.reason.plate' };
    default:
      return { pair: ['skinning', 'leatherworking'], reason: 'planner.reason.leather' };
  }
}

/**
 * Two questions, one answer. It always commits to a single pair: offering a menu of
 * options would just hand the reader back the decision they came here to avoid.
 */
export default function ProfessionPlanner({ locale, names }: Props): React.ReactElement {
  const t = useTranslations(locale);
  const [className, setClassName] = useState('warrior');
  const [goal, setGoal] = useState<Goal>('self');

  const { pair, reason } = recommend(className, goal);
  const goals: readonly Goal[] = ['gold', 'self', 'raid'];

  return (
    <section className="panel stack" aria-labelledby="planner-title">
      <h2 id="planner-title">{t('planner.title')}</h2>
      <p className="small muted">{t('planner.lead')}</p>

      <div className="fields">
        <label>
          {t('planner.class')}
          <select value={className} onChange={(event) => setClassName(event.target.value)}>
            {playableClasses.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.name[locale]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('planner.goal')}
          <select value={goal} onChange={(event) => setGoal(event.target.value as Goal)}>
            {goals.map((option) => (
              <option key={option} value={option}>
                {t(`planner.goal.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="verdict">
        <span className="muted small">{t('planner.result')} </span>
        <strong>{names[pair[0]] ?? pair[0]}</strong>
        <span className="muted"> {t('planner.and')} </span>
        <strong>{names[pair[1]] ?? pair[1]}</strong>
      </p>

      <p>{t(reason)}</p>
      <p className="small muted">{t('planner.note')}</p>
    </section>
  );
}
