import { useState } from 'react';

import { useTranslations, type Locale } from '../../i18n';
import { exportToString, importFromString } from '../../lib/progress/store';
import { useProgress } from './useProgress';

interface Props {
  locale: Locale;
}

type Outcome = 'idle' | 'copied' | 'imported' | 'failed';

/** For readers who will not install anything and will not sign in. */
export default function ProgressTransfer({ locale }: Props): React.ReactElement {
  const t = useTranslations(locale);
  useProgress();

  const [exported, setExported] = useState('');
  const [pasted, setPasted] = useState('');
  const [outcome, setOutcome] = useState<Outcome>('idle');

  async function onExport(): Promise<void> {
    setExported(await exportToString());
    setOutcome('idle');
  }

  async function onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(exported);
      setOutcome('copied');
    } catch {
      // Clipboard permission can be refused; the string is on screen and selectable.
      setOutcome('idle');
    }
  }

  async function onImport(): Promise<void> {
    setOutcome((await importFromString(pasted)) ? 'imported' : 'failed');
  }

  return (
    <details className="panel transfer">
      <summary>{t('progress.transfer.title')}</summary>
      <div className="stack">
        <p className="small muted">{t('progress.transfer.lead')}</p>

        <div className="row">
          <button type="button" className="button" onClick={() => void onExport()}>
            {t('progress.transfer.export')}
          </button>
          {exported !== '' && (
            <button type="button" className="button button-quiet" onClick={() => void onCopy()}>
              {outcome === 'copied' ? t('progress.transfer.copied') : t('progress.transfer.copy')}
            </button>
          )}
        </div>

        {exported !== '' && (
          <output className="code" aria-label={t('progress.transfer.title')}>
            {exported}
          </output>
        )}

        <label className="stack">
          <span className="small">{t('progress.transfer.importLabel')}</span>
          <textarea
            rows={3}
            value={pasted}
            spellCheck={false}
            onChange={(event) => {
              setPasted(event.target.value);
              setOutcome('idle');
            }}
          />
        </label>

        <div className="row">
          <button
            type="button"
            className="button"
            disabled={pasted.trim() === ''}
            onClick={() => void onImport()}
          >
            {t('progress.transfer.import')}
          </button>
        </div>

        {outcome === 'imported' && <p className="small">{t('progress.transfer.imported')}</p>}
        {outcome === 'failed' && (
          <p className="small warn">{t('progress.transfer.importFailed')}</p>
        )}
        <p className="small muted">{t('progress.transfer.mergeNote')}</p>
      </div>
    </details>
  );
}
