/* LessonSidebar - search, the five levels with their lessons, and the locked/unlocked handbook. */
import { useMemo, useState } from 'react';
import { useTranslation, useCurriculum } from '../../i18n/index.jsx';
import { useStore } from '../../context/StoreContext.jsx';
import { useActivity } from '../../context/ActivityContext.jsx';
import { HANDBOOK, LEVELS, TOTAL, LEVEL_COUNT, bookUnlocked, lessonsDone, partReadCount } from '../progress/progress.js';
import { CheckIcon, ChevronRightIcon, CloseIcon, LockIcon, SearchIcon } from '../../components/icons.jsx';

function Highlight({ text, q }) {
  if (!q) return text;
  const at = text.toLowerCase().indexOf(q);
  if (at === -1) return text;
  return (<>{text.slice(0, at)}<mark className="rounded bg-accent-soft px-0.5 text-fg">{text.slice(at, at + q.length)}</mark>{text.slice(at + q.length)}</>);
}

export default function LessonSidebar({ onPick }) {
  const { t, n } = useTranslation();
  const cur = useCurriculum();
  const { state } = useStore();
  const { activity, selectLesson, selectBookPage } = useActivity();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set([activity.li || 0]));
  const [bookOpen, setBookOpen] = useState(true);
  const q = query.trim().toLowerCase();
  const done = lessonsDone(state);
  const unlocked = bookUnlocked(state);
  const pct = TOTAL ? Math.round((done / TOTAL) * 100) : 0;
  const hb = cur.handbook();

  const levels = useMemo(() => LEVELS.map((level, li) => {
    const lv = cur.level(level);
    const lessons = level.lessons.map((lesson, i) => ({ lesson, i, text: cur.lesson(lesson) })).filter(({ lesson, text }) => {
      if (!q) return true;
      const hay = [lesson.title, lesson.tagline, lesson.definition, lesson.rules.join(' '), lesson.examples.map((e) => e.text).join(' '),
        text.title, text.tagline, text.definition, text.rules.join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
    return { level, li, lv, lessons };
  }).filter((x) => x.lessons.length), [q, cur]);

  const parts = useMemo(() => HANDBOOK.parts.map((part, ci) => ({ part, ci, text: cur.part(part) })).filter(({ part, text }) => {
    if (!q) return true;
    const hay = [part.title, part.subtitle, part.summary, text.title, text.subtitle, text.summary, part.pages.map((p) => p.text + ' ' + p.focus).join(' ')].join(' ').toLowerCase();
    return hay.includes(q);
  }), [q, cur]);

  const toggle = (li) => setOpen((s) => { const c = new Set(s); if (c.has(li)) c.delete(li); else c.add(li); return c; });
  const empty = !levels.length && !parts.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative m-3 mb-2">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          id="searchInput" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" spellCheck={false}
          placeholder={t('learn.search', { total: TOTAL })} aria-label={t('learn.searchLabel')}
          className="w-full rounded-xl border border-line bg-surface py-2 ps-9 pe-9 text-sm text-fg placeholder:text-faint"
        />
        {query && (
          <button type="button" aria-label={t('learn.clear')} onClick={() => setQuery('')} className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint hover:text-fg">
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label={t('learn.levels')}>
        {levels.map(({ level, li, lv, lessons }) => {
          const isOpen = open.has(li) || !!q;
          return (
            <div key={level.id} className="mb-1.5">
              <button type="button" aria-expanded={isOpen} onClick={() => toggle(li)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start hover:bg-surface2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft font-mono text-xs font-bold text-primary-text">{n(String(li + 1).padStart(2, '0'))}</span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{lv.name}</strong>
                  <small className="block truncate text-xs text-faint">{lv.subtitle}</small>
                </span>
                <span className="text-xs text-faint">{n(lessons.length)}</span>
                <ChevronRightIcon className={'size-4 text-faint transition-transform rtl:-scale-x-100 ' + (isOpen ? 'rotate-90 rtl:-rotate-90' : '')} />
              </button>
              {isOpen && (
                <div className="ms-4 border-s border-line ps-2">
                  {lessons.map(({ lesson, i, text }) => {
                    const active = activity.kind === 'lesson' && activity.li === li && activity.i === i;
                    const isDone = !!state.progress.done[lesson.id];
                    const best = state.progress.best[lesson.id];
                    return (
                      <button
                        key={lesson.id} type="button" aria-current={active ? 'true' : undefined} data-lesson={lesson.id}
                        onClick={() => { selectLesson(li, i); if (onPick) onPick(); }}
                        className={'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm transition-colors ' + (active ? 'bg-primary-soft font-semibold text-fg shadow-[inset_3px_0_0_var(--primary-text)] rtl:shadow-[inset_-3px_0_0_var(--primary-text)]' : 'text-dim hover:bg-surface2 hover:text-fg')}
                      >
                        <span className="min-w-0 flex-1"><Highlight text={text.title} q={q} /></span>
                        {best ? <span className="text-xs text-faint" title={t('learn.personalBest')}>{n(best.wpm)} {t('units.wpm')}</span> : null}
                        {isDone ? <CheckIcon className="size-4 shrink-0 text-ok" /> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {parts.length > 0 && (
          <div className={'mb-1.5 ' + (unlocked ? '' : 'opacity-90')}>
            <button type="button" aria-expanded={bookOpen} onClick={() => setBookOpen((v) => !v)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start hover:bg-surface2" data-testid="handbook-head">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft font-mono text-xs font-bold text-accent">{n(String(LEVEL_COUNT + 1).padStart(2, '0'))}</span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{hb.name}</strong>
                <small className="block truncate text-xs text-faint">{hb.title}</small>
              </span>
              <span className="text-xs text-faint">{n(parts.reduce((s, p) => s + p.part.pages.length, 0))}</span>
              {unlocked ? <ChevronRightIcon className={'size-4 text-faint transition-transform rtl:-scale-x-100 ' + (bookOpen || q ? 'rotate-90 rtl:-rotate-90' : '')} /> : <LockIcon className="size-4 text-faint" />}
            </button>
            {(bookOpen || q) && (
              <div className="ms-4 border-s border-line ps-2">
                {!unlocked && (
                  <div className="my-1 rounded-lg bg-surface2 p-2.5 text-xs text-dim">
                    <b className="text-fg">{t('learn.doneCount', { done, total: TOTAL })}</b>
                    <div className="my-1.5 h-1.5 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-primary-text" style={{ width: pct + '%' }} /></div>
                    {t('learn.finishAll')}
                  </div>
                )}
                {parts.map(({ part, ci, text }) => {
                  const read = partReadCount(state, part);
                  const active = activity.kind === 'book' && activity.ci === ci;
                  return (
                    <button
                      key={part.id} type="button" aria-current={active ? 'true' : undefined} data-part={part.id}
                      onClick={() => {
                        const first = part.pages.findIndex((p) => !state.progress.bookRead[p.id]);
                        selectBookPage(ci, first === -1 ? 0 : first);
                        if (onPick) onPick();
                      }}
                      className={'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm transition-colors ' + (active ? 'bg-primary-soft font-semibold text-fg' : 'text-dim hover:bg-surface2 hover:text-fg')}
                    >
                      <span className="min-w-0 flex-1"><Highlight text={text.title} q={q} /></span>
                      <span className="text-xs text-faint">{n(read)}/{n(part.pages.length)}</span>
                      {read === part.pages.length ? <CheckIcon className="size-4 shrink-0 text-ok" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {empty && <p className="p-3 text-sm text-dim">{t('learn.noMatch', { q: query.trim() })}</p>}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <div className="mb-1.5 flex justify-between text-xs text-dim"><span>{t('learn.progressLabel')}</span><b>{n(pct)}%</b></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface2" role="presentation"><span className="block h-full rounded-full bg-gradient-to-r from-primary-text to-accent transition-[width] duration-500" style={{ width: pct + '%' }} /></div>
      </div>
    </div>
  );
}
