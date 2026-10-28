import { useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useActivity } from '../context/ActivityContext.jsx';
import { navigate } from '../router.jsx';
import * as core from '../lib/core.js';
import { Button, Card, PageHead } from '../components/ui.jsx';
import { BoltIcon, TargetIcon, KeysIcon, SparkIcon } from '../components/icons.jsx';
import { gameSession } from '../features/practice/sessions.js';

const GAMES = [['sprint', BoltIcon], ['accuracy', TargetIcon], ['code', KeysIcon], ['daily', SparkIcon]];

export default function Games() {
  const { t, n } = useTranslation();
  const { state } = useStore();
  const { startSession } = useActivity();
  const today = core.dateKey();
  return (
    <>
      <PageHead title={t('games.title')} subtitle={t('games.subtitle')} />
      <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
        {GAMES.map(([id, Icon]) => {
          const g = state.games[id];
          return (
            <li key={id}>
              <Card as="div" className="flex h-full flex-col transition-all hover:-translate-y-0.5 hover:border-primary-text motion-reduce:transform-none">
                <span className="mb-3 grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="size-6" /></span>
                <h2 className="text-lg font-bold">{t('games.' + id + '.name')}</h2>
                <p className="text-dim">{t('games.' + id + '.desc')}</p>
                <p className="mt-2 text-sm text-faint">{t('games.' + id + '.rule')}</p>
                <p className="my-3 flex-1 text-sm font-semibold text-primary-text">
                  {g ? t('games.bestScore', { score: g.bestScore, plays: g.plays }) : t('games.notPlayed')}
                  {id === 'daily' && <span className="ms-2 text-dim">– {state.daily[today] ? t('games.doneToday') : t('games.notDoneToday')}</span>}
                </p>
                <Button variant="primary" onClick={() => { startSession(gameSession(id)); navigate('/learn'); }} data-testid={'game-' + id}>{g ? t('games.playAgain') : t('games.play')}</Button>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="sr-only">{n(0)}</p>
    </>
  );
}
