/* ActivityContext - what the typing page is currently showing: a lesson, a handbook
   page, a practice run or a game. It lives above the pages, so changing language or
   visiting another page never loses the lesson or run the learner was on. */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useStore } from './StoreContext.jsx';
import { HANDBOOK, LEVELS, bookUnlocked } from '../features/progress/progress.js';

const ActivityContext = createContext(null);

function initialActivity(state) {
  const last = state.progress.last || {};
  if (last.section === 'book' && bookUnlocked(state) && HANDBOOK.parts[last.ci] && HANDBOOK.parts[last.ci].pages[last.pi]) {
    return { kind: 'book', ci: last.ci, pi: last.pi };
  }
  const li = LEVELS[last.li] ? last.li : 0;
  const i = LEVELS[li].lessons[last.i] ? last.i : 0;
  return { kind: 'lesson', li, i };
}

export function ActivityProvider({ children }) {
  const { S, state } = useStore();
  const [activity, setActivity] = useState(() => initialActivity(state));
  const [example, setExample] = useState(null);
  const [rev, setRev] = useState(0);
  const lastRef = useRef(activity);
  const focusWanted = useRef(false);

  const remember = useCallback((a) => {
    S.update((d) => {
      const prev = d.progress.last || { li: 0, i: 0, ci: 0, pi: 0 };
      d.progress.last = a.kind === 'book'
        ? { section: 'book', li: prev.li, i: prev.i, ci: a.ci, pi: a.pi }
        : { section: 'lesson', li: a.li, i: a.i, ci: prev.ci || 0, pi: prev.pi || 0 };
    });
  }, [S]);

  const go = useCallback((a, opts) => {
    lastRef.current = a;
    setActivity(a);
    setExample(null);
    setRev((r) => r + 1);
    if (a.kind === 'lesson' || a.kind === 'book') remember(a);
    return opts;
  }, [remember]);

  const value = useMemo(() => ({
    activity, example, rev,
    selectLesson: (li, i) => { if (LEVELS[li] && LEVELS[li].lessons[i]) go({ kind: 'lesson', li, i }); },
    /** Returns false (and shows the locked card) while the handbook is locked. */
    selectBookPage: (ci, pi) => {
      const part = HANDBOOK.parts[ci];
      if (!part || !part.pages[pi]) return false;
      if (!bookUnlocked(S.state)) { go({ kind: 'locked', ci }); return false; }
      go({ kind: 'book', ci, pi });
      return true;
    },
    startSession: (session) => { focusWanted.current = true; go({ kind: session.kind, session }); },
    /** True once after a practice/game run was started from another page. */
    consumeFocus: () => { const v = focusWanted.current; focusWanted.current = false; return v; },
    loadExample: (text) => { setExample(text); setRev((r) => r + 1); },
    restart: () => setRev((r) => r + 1),
  }), [activity, example, rev, go, S]);

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used inside <ActivityProvider>');
  return ctx;
}
