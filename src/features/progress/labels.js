/* Run labels are derived from the stored ids at display time, so the Dashboard shows them
   in the active language even for runs saved while another language was selected. */
import { FLAT, HANDBOOK } from './progress.js';

export function runLabel(h, t, cur) {
  const id = h.id || '';
  if (h.kind === 'lesson') {
    const f = FLAT.find((x) => x.lesson.id === id);
    if (f) return cur.lesson(f.lesson).title;
  } else if (h.kind === 'book') {
    const part = HANDBOOK.parts.find((p) => id === p.id || id.startsWith(p.id + '-'));
    if (part) return cur.part(part).title;
  } else if (h.kind === 'practice') {
    let m = /^practice-letters-([a-z])$/.exec(id);
    if (m) return t('practice.letterDrill', { l: m[1] });
    m = /^practice-timed-(\d+)$/.exec(id);
    if (m) return t('practice.timedLabel', { n: Number(m[1]) });
    m = /^practice-([a-z]+)$/.exec(id);
    if (m && m[1] === 'weak') return t('practice.weak');
    if (m && t('practice.modes.' + m[1] + '.name') !== 'practice.modes.' + m[1] + '.name') return t('practice.modes.' + m[1] + '.name');
  } else if (h.kind === 'game') {
    const m = /^game-([a-z]+)$/.exec(id);
    if (m && t('games.' + m[1] + '.name') !== 'games.' + m[1] + '.name') return t('games.' + m[1] + '.name');
  }
  return h.label || id;
}
