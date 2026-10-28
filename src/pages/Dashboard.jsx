import { useMemo } from 'react';
import { useCurriculum, useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { Link } from '../router.jsx';
import * as core from '../lib/core.js';
import { ACHIEVEMENTS, BOOK_PAGE_TOTAL, HANDBOOK, TOTAL, booksReadCount, bookUnlocked, firstUnfinishedLesson, lessonsDone, masteryAcc } from '../features/progress/progress.js';
import { runLabel } from '../features/progress/labels.js';
import { Button, Card, PageHead, SectionTitle, Stat, btnClass } from '../components/ui.jsx';
import LineChart from '../components/LineChart.jsx';
import { useActivity } from '../context/ActivityContext.jsx';
import { navigate } from '../router.jsx';

const N_RUNS = 10;

export default function Dashboard() {
  const { t, n, formatDate, formatDuration } = useTranslation();
  const cur = useCurriculum();
  const { state } = useStore();
  const { selectLesson, selectBookPage } = useActivity();
  const hist = state.history;
  const recent = useMemo(() => hist.slice(-N_RUNS), [hist]);
  const empty = hist.length === 0 && lessonsDone(state) === 0 && state.quizzes.answered === 0;

  if (empty) {
    return (<><PageHead title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <Card className="py-12 text-center"><h2 className="text-xl font-bold">{t('dashboard.emptyTitle')}</h2><p className="mx-auto mb-5 mt-2 max-w-md text-dim">{t('dashboard.emptyText')}</p>
        <Link to="/learn" className={btnClass('primary', 'lg', 'no-underline')}>{t('common.startLesson')}</Link></Card></>);
  }

  const avg = (arr, k) => (arr.length ? Math.round(arr.reduce((s, r) => s + r[k], 0) / arr.length) : 0);
  const best = hist.reduce((m, r) => Math.max(m, r.wpm), 0);
  const allAvgAcc = hist.length ? Math.round(hist.reduce((s, r) => s + r.acc, 0) / hist.length) : 0;
  const cards = [
    [formatDuration(state.totals.seconds), t('dashboard.cards.time')],
    [n(state.totals.sessions), t('dashboard.cards.runs')],
    ...(hist.length ? [[n(avg(recent, 'wpm')), t('dashboard.cards.avgWpm', { n: recent.length })], [n(best), t('dashboard.cards.bestWpm')], [n(allAvgAcc) + '%', t('dashboard.cards.avgAcc')]] : []),
    [n(lessonsDone(state)) + ' / ' + n(TOTAL), t('dashboard.cards.lessons')],
    [n(booksReadCount(state)) + ' / ' + n(BOOK_PAGE_TOTAL), t('dashboard.cards.pages')],
    ...(state.quizzes.answered ? [[n(state.quizzes.correct) + ' / ' + n(state.quizzes.answered), t('dashboard.cards.quiz')]] : []),
    [n(Object.keys(state.days).length), t('dashboard.cards.days')],
  ];

  const weak = Object.keys(state.mistakes).sort((a, b) => state.mistakes[b] - state.mistakes[a]).slice(0, 8);
  const next = firstUnfinishedLesson(state);
  const unlocked = bookUnlocked(state);
  let nextBook = null;
  if (unlocked) HANDBOOK.parts.some((p, ci) => p.pages.some((pg, pi) => { if (!state.progress.bookRead[pg.id]) { nextBook = { p, ci, pi }; return true; } return false; }));
  const done = lessonsDone(state);
  const unlockedCount = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;

  return (
    <>
      <PageHead title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" data-testid="dash-cards">
        {cards.map(([v, l]) => <div key={l}><dt className="sr-only">{l}</dt><dd className="m-0"><Stat value={<span dir="ltr">{v}</span>} label={l} /></dd></div>)}
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {['wpm', 'acc'].map((k) => (
          <Card key={k}>
            <h2 className="mb-2 font-bold">{t('dashboard.' + k + 'Chart', { n: recent.length })}</h2>
            {recent.length >= 3 ? (
              <>
                <LineChart values={recent.map((r) => (k === 'wpm' ? r.wpm : r.acc))} min={k === 'acc' ? Math.min(100, Math.max(0, Math.floor(Math.min(...recent.map((r) => r.acc)) / 10) * 10)) : 0} max={k === 'acc' ? 100 : undefined} label={t('dashboard.' + k + 'Alt')} color={k === 'wpm' ? 'var(--color-primary-text)' : 'var(--color-correct)'} format={(v) => n(v)} />
                <p className="flex justify-between text-xs text-faint"><span>{t('dashboard.oldest')}</span><span>{t('dashboard.latest')}</span></p>
              </>
            ) : <p className="text-sm text-dim">{t('dashboard.needThree')}</p>}
          </Card>
        ))}
      </div>

      <SectionTitle>{t('dashboard.keys')}</SectionTitle>
      <Card>
        {weak.length ? (<><p className="mb-3 text-sm text-dim">{t('dashboard.keysText')}</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" dir="ltr">{weak.map((c) => <li key={c} className="rounded-lg border border-line bg-surface2 px-3 py-1.5 font-mono"><b>{c === ' ' ? t('results.space') : c}</b> <span className="text-xs text-dim">×{n(state.mistakes[c])}</span></li>)}</ul></>) : <p className="text-sm text-dim">{t('dashboard.noMistakes')}</p>}
      </Card>

      {hist.length > 0 && (<>
        <SectionTitle>{t('dashboard.recent')}</SectionTitle>
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[34rem] text-sm">
            <thead><tr className="border-b border-line text-start text-xs text-faint">{['when', 'what', 'wpm', 'accuracy', 'time'].map((k) => <th key={k} scope="col" className="px-4 py-2.5 text-start font-semibold">{t('dashboard.' + k)}</th>)}</tr></thead>
            <tbody>{hist.slice(-8).reverse().map((r, i) => (
              <tr key={r.at + '-' + i} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-dim">{formatDate(r.at)}</td><td className="px-4 py-2.5">{runLabel(r, t, cur)}</td>
                <td className="px-4 py-2.5 tabular-nums">{n(r.wpm)}</td><td className="px-4 py-2.5 tabular-nums">{n(r.acc)}%</td><td className="px-4 py-2.5 tabular-nums">{n(core.formatTime(r.seconds))}</td>
              </tr>))}</tbody>
          </table>
        </Card></>)}

      <SectionTitle>{t('dashboard.goals')}</SectionTitle>
      <Card>
        <ul className="m-0 grid list-disc gap-1.5 ps-5 text-sm text-dim">
          <li>{t('dashboard.goal1', { acc: masteryAcc(state) })}</li><li>{t('dashboard.goal2')}</li><li>{t('dashboard.goal3')}</li>
        </ul>
        <h3 className="mb-2 mt-5 font-bold">{t('dashboard.suggest')}</h3>
        {done < TOTAL ? (
          <Button variant="primary" onClick={() => { selectLesson(next.li, next.i); navigate('/learn'); }}>{t('dashboard.suggestLesson', { title: cur.lesson(next.lesson).title })}</Button>
        ) : nextBook ? (
          <Button variant="primary" onClick={() => { selectBookPage(nextBook.ci, nextBook.pi); navigate('/learn'); }}>{t('dashboard.suggestHandbook', { title: cur.part(nextBook.p).title })}</Button>
        ) : <Link to="/practice" className={btnClass('primary', 'md', 'no-underline')}>{t('dashboard.suggestPractice')}</Link>}
      </Card>

      <SectionTitle>{t('dashboard.achievements', { n: unlockedCount, total: ACHIEVEMENTS.length })}</SectionTitle>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const at = state.achievements[a.id];
          return (
            <li key={a.id} className={'flex gap-3 rounded-2xl border p-4 ' + (at ? 'border-accent bg-accent-soft' : 'border-line bg-surface opacity-70')}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface2 text-sm font-black" aria-hidden="true" dir="ltr">{a.icon}</span>
              <div><b className="block">{t('achievements.' + a.id + '.name')}</b><span className="text-sm text-dim">{t('achievements.' + a.id + '.desc')}</span>
                <span className="block text-xs text-faint">{at ? t('dashboard.unlocked', { date: formatDate(at) }) : t('dashboard.locked')}</span></div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
