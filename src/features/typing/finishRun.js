/* finishRun - everything that happens when a run ends: scoring, history, games,
   achievements. It returns plain data (translation keys + numbers) that the
   results card shows in whatever language is active. */
import * as core from '../../lib/core.js';
import {
  FLAT, HANDBOOK, TOTAL, LEVELS, bookUnlocked, evaluateAchievements, lessonsDone, recordGame, recordRun,
  scoreBookPage, scoreLesson, scoreSession,
} from '../progress/progress.js';

export function resultTitleKey(wpm, acc, typed) {
  if (typed < 5) return 'results.title.tooShort';
  if (acc >= 99 && wpm >= 50) return 'results.title.flawless';
  if (acc >= 97) return 'results.title.clean';
  if (acc >= 90) return 'results.title.solid';
  if (acc >= 80) return 'results.title.good';
  return 'results.title.accuracy';
}

function nextInfo(activity, isCustom) {
  if (activity.kind === 'practice' || activity.kind === 'game') {
    return { has: true, label: activity.kind === 'game' ? 'results.playAgain' : 'results.newText', title: '' };
  }
  if (activity.kind === 'book') {
    const part = HANDBOOK.parts[activity.ci];
    const morePages = activity.pi + 1 < part.pages.length;
    const moreParts = activity.ci + 1 < HANDBOOK.parts.length;
    return { has: morePages || moreParts, label: morePages ? 'results.nextPage' : moreParts ? 'results.nextPart' : 'results.allPages', title: morePages || moreParts ? '' : 'results.endOfHandbook' };
  }
  const pos = FLAT.findIndex((f) => f.li === activity.li && f.i === activity.i);
  const has = pos !== -1 && pos + 1 < FLAT.length;
  return { has, label: 'results.nextLesson', title: has ? '' : 'results.endOfCurriculum' };
}

/**
 * @param S        the store
 * @param activity {kind, li, i, ci, pi, session}
 * @param isCustom true when the learner is typing an example from the notes
 * @param res      engine result
 */
export function processFinish(S, activity, isCustom, res) {
  const { wpm, acc } = res;
  const doneBefore = lessonsDone(S.state);
  const session = activity.session || null;
  const isBook = activity.kind === 'book';
  const lesson = activity.kind === 'lesson' ? LEVELS[activity.li].lessons[activity.i] : null;
  const part = isBook ? HANDBOOK.parts[activity.ci] : null;
  const page = isBook ? part.pages[activity.pi] : null;
  const reason = res.reason;
  const toasts = [];

  const info = {
    reason, wpm, raw: res.raw, acc, errors: res.errors, consistency: res.consistency, seconds: res.seconds, typed: res.typed, samples: res.samples,
    eyebrow: reason === 'time' ? 'results.eyebrow.time' : reason === 'early' ? 'results.eyebrow.early' : reason === 'limit' ? 'results.eyebrow.limit'
      : session ? (session.kind === 'game' ? 'results.eyebrow.game' : 'results.eyebrow.practice')
        : isBook ? 'results.eyebrow.page' : isCustom ? 'results.eyebrow.example' : 'results.eyebrow.lesson',
    title: resultTitleKey(wpm, acc, res.typed),
    sub: session ? { key: 'results.sub.session', vars: {}, label: session.label }
      : isBook ? { key: 'results.sub.page', vars: { n: activity.pi + 1, total: part.pages.length }, part }
        : isCustom ? { key: 'results.sub.example', vars: {}, lesson } : { key: 'results.sub.lesson', vars: {}, lesson },
    notes: [], tip: null, review: [], gameInfo: null, unlockedHandbook: false,
    next: nextInfo(activity, isCustom),
  };

  const scored = reason === 'complete' && !session;
  let r = null;
  if (session) {
    r = scoreSession(S, session, wpm, acc, reason, res.typed);
    info.notes = r.notes;
  } else if (!scored) {
    info.notes = [{ key: isBook ? 'results.notScoredPage' : isCustom ? 'results.exampleNotScored' : 'results.notScored' }];
    if (isBook) info.tip = { type: 'page', part, page };
    else if (!isCustom) info.tip = { type: 'lesson', lesson };
  } else if (isBook) {
    r = scoreBookPage(S, part, page, wpm, acc);
    info.notes = r.notes; info.tip = r.tip;
  } else if (!isCustom) {
    r = scoreLesson(S, lesson, wpm, acc);
    info.notes = r.notes; info.tip = r.tip;
    if (r.completed) toasts.push({ key: 'results.lessonToast', vars: { lessonId: lesson.id }, kind: 'ok' });
  } else {
    info.notes = [{ key: 'results.exampleNotScored' }];
    info.tip = { type: 'lesson', lesson };
  }

  const justUnlocked = lessonsDone(S.state) > doneBefore && lessonsDone(S.state) >= TOTAL;
  if (justUnlocked) { info.unlockedHandbook = true; toasts.push({ key: 'results.unlockedToast', kind: 'ok' }); }

  info.review = Object.keys(res.mistakeCounts).map((c) => [c, res.mistakeCounts[c]]).sort((a, b) => b[1] - a[1]).slice(0, 6);

  /* History, totals, mistakes */
  const detail = {
    kind: session ? session.kind : isBook ? 'book' : 'lesson',
    id: session ? session.id : isBook ? page.id : lesson.id,
    label: session ? (session.label || session.id) : isBook ? part.title : lesson.title,
    wpm, raw: res.raw, acc, seconds: Math.round(res.seconds), chars: res.typed, mistakes: res.errors, reason,
    mistakeCounts: res.mistakeCounts,
  };
  if (session && session.gameId) {
    const g = recordGame(S, session, detail);
    info.gameInfo = g;
  }
  recordRun(S, detail);
  const fresh = evaluateAchievements(S);
  return { info, toasts, achievements: fresh, bookUnlocked: bookUnlocked(S.state) };
}
