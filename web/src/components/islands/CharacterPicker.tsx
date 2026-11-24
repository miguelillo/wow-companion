import { useState } from 'react';

import { classNameFor, playableClasses } from '../../data/classes';
import { useTranslations, type Locale } from '../../i18n';
import {
  addCharacter,
  getActiveCharacter,
  hasStorageProblem,
  removeCharacter,
  setActiveCharacter,
} from '../../lib/progress/store';
import { useProgress } from './useProgress';

interface Props {
  locale: Locale;
}

/**
 * Add characters, switch between them, remove one. Everything lives in this browser, so
 * there is nothing to sign into and nothing to lose by trying it.
 */
export default function CharacterPicker({ locale }: Props): React.ReactElement {
  const t = useTranslations(locale);
  const progress = useProgress();
  const [adding, setAdding] = useState(false);

  const characters = Object.entries(progress.characters);
  const active = getActiveCharacter(progress);

  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const realm = String(data.get('realm') ?? '').trim();
    if (name.length < 2 || realm.length === 0) return;

    addCharacter({
      name,
      realm,
      class: String(data.get('class') ?? 'warrior'),
      faction: data.get('faction') === 'horde' ? 'horde' : 'alliance',
      level: Number(data.get('level') ?? 1),
    });
    setAdding(false);
  }

  return (
    <section className="panel stack" aria-labelledby="character-picker-title">
      <h2 id="character-picker-title">{t('progress.character.title')}</h2>

      {hasStorageProblem() && <p className="small warn">{t('progress.storage.unavailable')}</p>}

      {characters.length === 0 && !adding && <p>{t('progress.character.none')}</p>}

      {characters.length > 0 && (
        <ul className="roster">
          {characters.map(([id, character]) => (
            <li key={id}>
              <button
                type="button"
                className={id === progress.activeCharacter ? 'chip chip-active' : 'chip'}
                aria-pressed={id === progress.activeCharacter}
                onClick={() => setActiveCharacter(id)}
              >
                <strong>{character.name}</strong>
                <span className="small muted">
                  {character.realm} · {classNameFor(character.class, locale)} ·{' '}
                  {t('progress.character.level')} {character.level}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={onSubmit} className="stack">
          <div className="fields">
            <label>
              {t('progress.character.name')}
              <input name="name" required minLength={2} maxLength={12} autoComplete="off" />
            </label>
            <label>
              {t('progress.character.realm')}
              <input name="realm" required maxLength={40} autoComplete="off" />
            </label>
            <label>
              {t('progress.character.class')}
              <select name="class" defaultValue="warrior">
                {playableClasses.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.name[locale]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('progress.character.faction')}
              <select name="faction" defaultValue="alliance">
                <option value="alliance">{t('progress.faction.alliance')}</option>
                <option value="horde">{t('progress.faction.horde')}</option>
              </select>
            </label>
            <label>
              {t('progress.character.level')}
              <input name="level" type="number" min={1} max={60} defaultValue={1} />
            </label>
          </div>
          <div className="row">
            <button type="submit" className="button">
              {t('progress.character.save')}
            </button>
            <button type="button" className="button button-quiet" onClick={() => setAdding(false)}>
              {t('progress.character.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <div className="row">
          <button type="button" className="button" onClick={() => setAdding(true)}>
            {t('progress.character.add')}
          </button>
          {active !== undefined && (
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                if (
                  globalThis.confirm(t('progress.character.removeConfirm', { name: active.name }))
                ) {
                  removeCharacter(progress.activeCharacter ?? '');
                }
              }}
            >
              {t('progress.character.remove')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
