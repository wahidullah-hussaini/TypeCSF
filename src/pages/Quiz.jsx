import { useMemo, useRef, useState } from 'react';
import { useCurriculum, useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Link } from '../router.jsx';
import { QUIZ_TOPICS, quizSet } from '../lib/content.js';
import { evaluateAchievements, ACHIEVEMENTS } from '../features/progress/progress.js';
import { Button, Card, Chip, PageHead, btnClass } from '../components/ui.jsx';
import { CheckIcon, CloseIcon } from '../components/icons.jsx';

const COUNT = 5;

export default function Quiz() {
  const { t, n } = useTranslation();
  const cur = useCurriculum();
  const { S, state } = useStore();
  const toast = useToast();
  const [topic, setTopic] = useState('mixed');
  const [run, setRun] = useState(null); // {topic, items, i, picked, score}
  const [done, setDone] = useState(null);
  const nextBtn = useRef(null);

  const start = () => { setDone(null); setRun({ topic, items: quizSet(topic, COUNT), i: 0, picked: null, score: 0 }); };

  const pick = (pos) => {
    if (!run || run.picked !== null) return;
    const right = pos === run.items[run.i].answer;
    setRun({ ...run, picked: pos, score: run.score + (right ? 1 : 0) });
    setTimeout(() => nextBtn.current && nextBtn.current.focus(), 0);
  };

  const next = () => {
    if (run.i + 1 < run.items.length) { setRun({ ...run, i: run.i + 1, picked: null }); return; }
    const pct = Math.round((run.score / run.items.length) * 100);
    S.update((d) => {
      d.quizzes.answered += run.items.length; d.quizzes.correct += run.score;
      d.quizzes.best[run.topic] = Math.max(d.quizzes.best[run.topic] || 0, pct);
      d.quizzes.history.push({ at: Date.now(), topic: run.topic, score: pct });
      if (d.quizzes.history.length > 50) d.quizzes.history.shift();
    });
    evaluateAchievements(S).forEach((id) => { if (ACHIEVEMENTS.some((a) => a.id === id)) toast(t('results.achievement', { name: t('achievements.' + id + '.name') }), 'ok'); });
    setDone({ score: run.score, total: run.items.length, pct, topic: run.topic });
    setRun(null);
  };

  const q = run ? run.items[run.i] : null;
  const text = q ? cur.quiz(q.id) : null;
  const q0 = state.quizzes;
  const topicName = (k) => (k === 'mixed' ? t('quiz.mixed') : t('quiz.topics.' + k));

  return (
    <>
      <PageHead title={t('quiz.title')} subtitle={t('quiz.subtitle')} />
      {!run && (
        <Card>
          {done && (
            <div className="mb-6 rounded-2xl bg-primary-soft p-5 text-center motion-safe:animate-pop" role="status" data-testid="quiz-done">
              <p className="text-sm font-bold text-primary-text">{t('quiz.complete')} – {topicName(done.topic)}</p>
              <p className="my-2 text-4xl font-black tabular-nums"><span dir="ltr">{n(done.score)} / {n(done.total)}</span></p>
              <p className="text-sm text-dim">{n(done.pct)}% {t('quiz.correctLabel')}</p>
              <p className="mt-2 font-semibold">{done.pct === 100 ? t('quiz.perfect') : done.pct >= 60 ? t('quiz.good') : t('quiz.start2')}</p>
              <Link to="/learn" className={btnClass('default', 'sm', 'mt-3 no-underline')}>{t('quiz.backToLessons')}</Link>
            </div>
          )}
          <h2 className="mb-2 font-bold">{t('quiz.topic')}</h2>
          <div role="group" aria-label={t('quiz.topic')} className="mb-5 flex flex-wrap gap-2">
            {['mixed', ...Object.keys(QUIZ_TOPICS)].map((k) => <Chip key={k} pressed={topic === k} onClick={() => setTopic(k)}>{topicName(k)}</Chip>)}
          </div>
          <Button variant="primary" size="lg" onClick={start} data-testid="quiz-start">{done ? t('quiz.again') : t('quiz.start')}</Button>
          {q0.answered > 0 && <p className="mt-4 text-sm text-dim">{t('quiz.so_far', { correct: q0.correct, answered: q0.answered, pct: Math.round((q0.correct / q0.answered) * 100) })}</p>}
        </Card>
      )}
      {run && (
        <Card className="motion-safe:animate-rise" aria-live="polite">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">{t('quiz.question', { n: run.i + 1, total: run.items.length, topic: t('quiz.topics.' + q.topic) })}</p>
          <h2 className="mb-5 text-xl font-bold leading-snug" dir="auto">{text.q}</h2>
          <div role="radiogroup" aria-label={text.q} className="grid gap-2.5">
            {q.order.map((orig, pos) => {
              const isAns = pos === q.answer;
              const chosen = run.picked === pos;
              const shown = run.picked !== null;
              const cls = shown ? (isAns ? 'border-correct bg-correct/10' : chosen ? 'border-wrong bg-wrong-bg' : 'border-line opacity-70') : 'border-line hover:border-primary-text hover:bg-surface2';
              return (
                <button key={pos} type="button" role="radio" aria-checked={chosen} disabled={shown && !chosen && !isAns} onClick={() => pick(pos)}
                  className={'flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-start transition-colors ' + cls} data-testid={'quiz-opt-' + pos}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface2 text-xs font-bold" aria-hidden="true">{shown && isAns ? <CheckIcon className="size-4 text-correct" /> : shown && chosen ? <CloseIcon className="size-4 text-wrong" /> : String.fromCharCode(65 + pos)}</span>
                  <span dir="auto">{text.options[orig]}</span>
                  {shown && isAns && <span className="ms-auto text-xs font-bold text-correct">{t('quiz.correctMark')}</span>}
                  {shown && chosen && !isAns && <span className="ms-auto text-xs font-bold text-wrong">{t('quiz.yourAnswer')}</span>}
                </button>
              );
            })}
          </div>
          {run.picked !== null && (
            <div className="mt-5" role="status">
              <p className="rounded-xl bg-surface2 p-3 text-sm"><b>{run.picked === q.answer ? t('quiz.correct') : t('quiz.wrong')}</b> <span dir="auto">{text.why}</span></p>
              <Button ref={nextBtn} variant="primary" className="mt-4" onClick={next} data-testid="quiz-next">{run.i + 1 < run.items.length ? t('quiz.next') : t('quiz.results')}</Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
