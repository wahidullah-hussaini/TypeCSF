import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useActivity } from '../context/ActivityContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { navigate } from '../router.jsx';
import { MODES } from '../lib/content.js';
import * as core from '../lib/core.js';
import { Button, Card, Chip, PageHead, SectionTitle } from '../components/ui.jsx';
import { LETTERS, TIMED_LENGTHS, practiceSession, weakSession } from '../features/practice/sessions.js';

const MAX_CUSTOM = 1200;

export default function Practice() {
  const { t, n } = useTranslation();
  const { state } = useStore();
  const { startSession } = useActivity();
  const toast = useToast();
  const [letter, setLetter] = useState('e');
  const [seconds, setSeconds] = useState(60);
  const [custom, setCustom] = useState('');
  const weak = useMemo(() => weakSession(state.mistakes), [state.mistakes]);

  const run = (session) => { startSession(session); navigate('/learn'); };
  const runCustom = () => {
    const r = core.sanitizeTypingText(custom, MAX_CUSTOM);
    if (r.text.length < 3) { toast(t('practice.customEmpty'), 'warn'); return; }
    if (r.removed || r.truncated || r.text !== custom.trim()) toast(t(r.truncated ? 'practice.customShort' : 'practice.customAdjusted'), 'ok');
    const s = practiceSession('custom'); s.text = r.text; run(s);
  };
  const simple = MODES.filter((m) => !['letters', 'timed', 'custom'].includes(m.id));

  return (
    <>
      <PageHead title={t('practice.title')} subtitle={t('practice.subtitle')} />
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {simple.map((m) => (
          <li key={m.id}>
            <Card as="div" className="flex h-full flex-col transition-all hover:-translate-y-0.5 hover:border-primary-text motion-reduce:transform-none">
              <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary-soft font-mono font-bold text-primary-text" aria-hidden="true" dir="ltr">{m.icon}</span>
              <h2 className="font-bold">{t('practice.modes.' + m.id + '.name')}</h2>
              <p className="mb-4 flex-1 text-sm text-dim">{t('practice.modes.' + m.id + '.desc')}</p>
              <Button variant="primary" onClick={() => run(practiceSession(m.id))} data-testid={'practice-' + m.id}>{t('games.play')}</Button>
            </Card>
          </li>
        ))}
      </ul>

      <SectionTitle id="letters-h">{t('practice.letters')}</SectionTitle>
      <Card aria-labelledby="letters-h">
        <p className="mb-3 text-sm text-dim">{t('practice.lettersHint')}</p>
        <div role="group" aria-label={t('practice.letters')} className="mb-4 flex flex-wrap gap-1.5" dir="ltr">
          {LETTERS.map((l) => <Chip key={l} pressed={letter === l} onClick={() => setLetter(l)} className="!px-3 font-mono uppercase">{l}</Chip>)}
        </div>
        <Button variant="primary" onClick={() => run(practiceSession('letters', { letter }))}>{t('practice.startLetters')}</Button>
      </Card>

      <SectionTitle id="timed-h">{t('practice.timed')}</SectionTitle>
      <Card aria-labelledby="timed-h">
        <p className="mb-2 text-sm font-semibold text-dim">{t('practice.length')}</p>
        <div role="group" aria-label={t('practice.length')} className="mb-4 flex gap-2">
          {TIMED_LENGTHS.map((s) => <Chip key={s} pressed={seconds === s} onClick={() => setSeconds(s)}>{t('practice.seconds', { n: s })}</Chip>)}
        </div>
        <Button variant="primary" onClick={() => run(practiceSession('timed', { seconds }))} data-testid="start-timed">{t('practice.startTimed')}</Button>
      </Card>

      <SectionTitle id="custom-h">{t('practice.custom')}</SectionTitle>
      <Card aria-labelledby="custom-h">
        <label htmlFor="custom-text" className="mb-1 block text-sm font-semibold">{t('practice.customLabel')}</label>
        <textarea id="custom-text" value={custom} onChange={(e) => setCustom(e.target.value.slice(0, 5000))} rows={5} dir="ltr" lang="en" placeholder={t('practice.customPlaceholder')}
          className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-sm text-fg placeholder:text-faint" />
        <p className="mb-3 mt-2 text-xs text-faint">{t('practice.customNote')} <span dir="ltr">{n(Math.min(custom.length, MAX_CUSTOM))}/{n(MAX_CUSTOM)}</span></p>
        <Button variant="primary" onClick={runCustom}>{t('practice.customStart')}</Button>
      </Card>

      {weak && (
        <>
          <SectionTitle id="weak-h">{t('practice.weak')}</SectionTitle>
          <Card aria-labelledby="weak-h">
            <p className="mb-1 text-dim">{t('practice.weakText', { keys: weak.keys.join(' ') })}</p>
            <p className="mb-3 text-xs text-faint">{t('practice.weakMeta')}</p>
            <Button variant="primary" onClick={() => run(weakSession(state.mistakes))}>{t('games.play')}</Button>
          </Card>
        </>
      )}
    </>
  );
}
