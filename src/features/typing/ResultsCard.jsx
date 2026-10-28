/* ResultsCard - shows the finished run. It receives structured data (translation keys),
   so it re-renders correctly if the language changes while it is on screen. */
import { forwardRef } from 'react';
import { formatTime } from '../../lib/core.js';
import { useCurriculum, useTranslation } from '../../i18n/index.jsx';
import { Button, Card } from '../../components/ui.jsx';
import ResultsChart from './ResultsChart.jsx';

const ResultsCard = forwardRef(function ResultsCard({ info, onRetry, onNext }, ref) {
  const { t, n, rich } = useTranslation();
  const cur = useCurriculum();
  const time = n(formatTime(info.seconds));

  let sub;
  if (info.sub.key === 'results.sub.session') sub = t(info.sub.key, { label: info.sub.label, time });
  else if (info.sub.key === 'results.sub.page') sub = t(info.sub.key, { ...info.sub.vars, title: cur.part(info.sub.part).title, time });
  else sub = t(info.sub.key, { title: cur.lesson(info.sub.lesson).title, time });

  const boldWrap = (v, name, i) => <b key={name + i} className="text-fg">{v}</b>;
  const tip = info.tip;
  let tipNode = null;
  if (tip && tip.type === 'lesson' && tip.lesson.rules[0]) {
    tipNode = <><b className="text-fg">{t('results.keyConcept')}</b> {cur.lesson(tip.lesson).rules[0]}</>;
  } else if (tip && tip.type === 'page' && tip.page.notes[0]) {
    const first = cur.page(tip.page).notes[0];
    tipNode = <><b className="text-fg">{t('results.pageConcepts')}</b> {first.termLocal} — {first.definition}</>;
  }

  const stats = [
    ['results.label.wpm', n(info.wpm)], ['results.label.raw', n(info.raw)], ['results.label.accuracy', n(info.acc) + '%'],
    ['results.label.mistakes', n(info.errors)], ['results.label.consistency', n(info.consistency) + '%'], ['results.label.time', time],
  ];
  const ids = ['resultWpm', 'resultRaw', 'resultAcc', 'resultErrors', 'resultConsistency', 'resultTime'];

  return (
    <Card ref={ref} id="resultsCard" tabIndex={-1} aria-labelledby="resultsTitle" className="motion-safe:animate-rise outline-none" data-testid="results">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{t(info.eyebrow)}</p>
          <h2 id="resultsTitle" className="text-2xl font-extrabold">{t(info.title)}</h2>
          <p className="text-dim">{sub}</p>
        </div>
        <div className="flex gap-2">
          <Button id="retryBtn" onClick={onRetry}>{t('results.tryAgain')}</Button>
          <Button id="nextBtn" variant="primary" disabled={!info.next.has} title={info.next.title ? t(info.next.title) : undefined} onClick={onNext}>{t(info.next.label)}</Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value], i) => (
          <div key={label} className="rounded-xl bg-surface2 px-3 py-2.5">
            <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-faint">{t(label)}</span>
            <span id={ids[i]} className="text-2xl font-bold tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      <ResultsChart samples={info.samples} />

      <div id="resultsNote" className="mt-3 space-y-2 text-sm text-dim" aria-live="polite">
        <p>
          {info.notes.map((note, i) => <span key={i}>{rich(note.key, { ...(note.vars || {}), ...(note.part ? { title: cur.part(note.part).title } : {}) }, boldWrap)}{' '}</span>)}
        </p>
        {info.gameInfo && (
          <p><b className="text-fg">{t('results.gameScore', { score: info.gameInfo.score })}</b>{info.gameInfo.isBest ? ' - ' + t('results.newGameBest') : ''}{info.gameInfo.score === 0 && info.reason !== 'time' ? ' ' + t('results.finishToScore') : ''}</p>
        )}
        {tipNode && <p>{tipNode}</p>}
        {info.unlockedHandbook && <p className="font-semibold text-accent">{t('results.unlockedNote')}</p>}
      </div>

      {info.review.length > 0 && (
        <div className="mt-3 rounded-xl bg-surface2 p-3 text-sm" id="resultsReview">
          <b>{t('results.keysToPractise')}</b>{' '}
          {info.review.map(([c, count]) => (
            <span key={c} className="me-3 inline-block"><kbd>{c === ' ' ? t('results.space') : c}</kbd> ×{n(count)}</span>
          ))}
          <span className="text-dim"> {t('results.reviewTip')}</span>
        </div>
      )}
    </Card>
  );
});

export default ResultsCard;
