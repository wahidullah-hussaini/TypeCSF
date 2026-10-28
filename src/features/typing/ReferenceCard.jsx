/* ReferenceCard - the notes shown beside the typing area: definition, key concepts and
   examples for a lesson; focus and key terms for a handbook page; tips for practice runs. */
import { useCurriculum, useTranslation } from '../../i18n/index.jsx';
import { useStore } from '../../context/StoreContext.jsx';
import { Card } from '../../components/ui.jsx';
import { ChevronDownIcon } from '../../components/icons.jsx';
import { HANDBOOK, LEVELS } from '../progress/progress.js';

function Block({ title, hint, children }) {
  return (
    <div>
      <h3 className="mb-2 flex items-baseline justify-between gap-2 text-xs font-bold uppercase tracking-wider text-faint">
        <span>{title}</span>{hint ? <span className="font-normal normal-case tracking-normal">{hint}</span> : null}
      </h3>
      {children}
    </div>
  );
}

const Preview = ({ children }) => <p dir="ltr" className="m-0 rounded-lg bg-surface2 p-2.5 text-left font-mono text-[0.85rem] text-dim">{children}</p>;

export default function ReferenceCard({ activity, locked, onExample, tt }) {
  const { t, n } = useTranslation();
  const cur = useCurriculum();
  const { settings, setSetting } = useStore();
  const open = settings.refOpen;

  let body = null;
  if (locked) {
    const hb = cur.handbook();
    body = (
      <>
        <Block title={t('learn.about.title')}><p className="m-0">{hb.blurb}</p></Block>
        <Block title={t('learn.about.parts')} hint={t('learn.about.partsCount', { n: HANDBOOK.parts.length })}>
          <ul className="m-0 list-disc space-y-1.5 ps-5">
            {HANDBOOK.parts.map((p) => {
              const x = cur.part(p);
              return <li key={p.id}>{t('learn.about.partLine', { title: x.title, pages: p.pages.length, summary: x.summary })}</li>;
            })}
          </ul>
        </Block>
        <p className="col-span-full m-0 text-xs text-faint">{t('learn.reference.source', { title: hb.title, author: hb.author, year: HANDBOOK.year, source: hb.source })}</p>
      </>
    );
  } else if (activity.kind === 'practice' || activity.kind === 'game') {
    const s = activity.session;
    body = (
      <>
        <Block title={t('learn.reference.aboutRun')}><p className="m-0">{s.descT ? tt(s.descT) : t('learn.reference.defaultAbout')}</p></Block>
        <Block title={t('learn.reference.tips')}>
          <ul className="m-0 list-disc space-y-1.5 ps-5"><li>{t('learn.reference.tip1')}</li><li>{t('learn.reference.tip2')}</li><li>{t('learn.reference.tip3')}</li></ul>
        </Block>
      </>
    );
  } else if (activity.kind === 'book') {
    const part = HANDBOOK.parts[activity.ci];
    const page = part.pages[activity.pi];
    const pg = cur.page(page);
    const hb = cur.handbook();
    const pt = cur.part(part);
    body = (
      <>
        <Block title={t('learn.reference.pageFocus')}><span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">{pg.focus}</span></Block>
        <Block title={t('learn.reference.pageConcepts')} hint={t('learn.reference.termsCount', { n: pg.notes.length })}>
          <ul className="m-0 list-none space-y-2.5 p-0">
            {pg.notes.map((note, i) => (
              <li key={i} className="rounded-lg bg-surface2 p-2.5">
                <span className="block font-bold text-primary-text">{note.termLocal}{note.termLocal !== note.term ? <bdi dir="ltr" className="ms-1 text-xs font-normal text-faint">({note.term})</bdi> : null}</span>
                <span className="block text-sm text-dim">{note.definition}</span>
                <span className="block text-xs italic text-faint">"{note.example}"</span>
              </li>
            ))}
          </ul>
        </Block>
        <Block title={t('learn.reference.yourPage')} hint={t('learn.reference.charsCount', { n: page.text.length })}><Preview>{page.text}</Preview></Block>
        <p className="col-span-full m-0 text-xs text-faint">
          {t('learn.reference.partInfo', { n: activity.ci + 1, total: HANDBOOK.parts.length, subtitle: pt.subtitle })} – {t('learn.reference.source', { title: hb.title, author: hb.author, year: HANDBOOK.year, source: hb.source })}
        </p>
      </>
    );
  } else {
    const lesson = LEVELS[activity.li].lessons[activity.i];
    const l = cur.lesson(lesson);
    body = (
      <>
        <Block title={t('learn.reference.definition')}><p className="m-0">{l.definition}</p></Block>
        <Block title={t('learn.reference.concepts')}><ul className="m-0 list-disc space-y-1.5 ps-5">{l.rules.map((r, i) => <li key={i}>{r}</li>)}</ul></Block>
        <Block title={t('learn.reference.examples')} hint={t('learn.reference.tapExample')}>
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {lesson.examples.map((ex, i) => (
              <li key={i}>
                <button type="button" title={t('learn.reference.practiseExample')} onClick={() => onExample(ex.text)} className="flex w-full flex-col gap-0.5 rounded-lg border border-line bg-surface2 px-2.5 py-2 text-start hover:border-primary-text">
                  <span dir="ltr" className="text-left font-mono text-[0.85rem]">{ex.text}</span>
                  <span className="text-xs text-dim">{l.notes[i]}</span>
                </button>
              </li>
            ))}
          </ul>
        </Block>
        <Block title={t('learn.reference.drill')}><Preview>{lesson.drill}</Preview></Block>
      </>
    );
  }

  return (
    <Card as="aside" id="referenceCard" aria-label={t('learn.reference.title')}>
      <button type="button" id="referenceToggle" aria-expanded={open} aria-controls="referenceBody" onClick={() => setSetting('refOpen', !open)} className="flex w-full items-center justify-between text-base font-bold">
        <span>{t('learn.reference.title')}</span>
        <ChevronDownIcon className={'size-5 transition-transform ' + (open ? '' : 'ltr:-rotate-90 rtl:rotate-90')} />
      </button>
      {open && <div id="referenceBody" className="mt-4 grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">{body}</div>}
    </Card>
  );
}
