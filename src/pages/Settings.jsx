import { useRef, useState } from 'react';
import { useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { usePwa } from '../context/PwaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, Chip, PageHead, SectionTitle, Switch } from '../components/ui.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { DownloadIcon, UploadIcon } from '../components/icons.jsx';

function Row({ id, name, hint, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-0">
      <div className="min-w-0 flex-1 basis-56"><p id={id} className="font-semibold">{name}</p><p className="text-sm text-dim">{hint}</p></div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
function Choice({ labelledBy, value, options, onChange, t }) {
  return <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">{options.map(([v, label]) => <Chip key={String(v)} pressed={value === v} onClick={() => onChange(v)}>{label}</Chip>)}</div>;
}

export default function Settings() {
  const { t } = useTranslation();
  const { S, settings, setSetting, persistent } = useStore();
  const pwa = usePwa();
  const toast = useToast();
  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);

  const doExport = () => {
    const blob = new Blob([S.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'typecsf-progress-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(t('settings.data.exported'), 'ok');
  };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 2e6) { toast(t('settings.data.badJson'), 'warn'); return; }
    f.text().then((text) => setPendingImport({ name: f.name, text })).catch(() => toast(t('settings.data.badJson'), 'warn'));
  };
  const closeImport = (v) => {
    const p = pendingImport; setPendingImport(null);
    if (v !== 'import' || !p) return;
    const r = S.importJson(p.text);
    toast(t('settings.data.' + r.code), r.ok ? 'ok' : 'warn');
  };
  const closeReset = (v) => {
    setResetOpen(false);
    if (v === 'keep') { S.resetProgressOnly(); toast(t('settings.data.resetDone'), 'ok'); }
    if (v === 'all') { S.resetAll(); toast(t('settings.data.resetDone'), 'ok'); }
  };

  const offline = pwa.swState === 'ready' ? t('settings.install.ready') : pwa.swState === 'unsupported' ? t('settings.install.unsupported') : t('settings.install.checking');

  return (
    <>
      <PageHead title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <Card>
        <Row id="s-theme" name={t('settings.theme.name')} hint={t('settings.theme.hint')}>
          <Choice labelledBy="s-theme" value={settings.theme} onChange={(v) => setSetting('theme', v)} options={[['system', t('settings.theme.system')], ['light', t('settings.theme.light')], ['dark', t('settings.theme.dark')]]} />
        </Row>
        <Row id="s-motion" name={t('settings.motion.name')} hint={t('settings.motion.hint')}>
          <Choice labelledBy="s-motion" value={settings.reducedMotion} onChange={(v) => setSetting('reducedMotion', v)} options={[['system', t('settings.motion.system')], ['on', t('settings.motion.on')], ['off', t('settings.motion.off')]]} />
        </Row>
        <Row id="s-sound" name={t('settings.sound.name')} hint={t('settings.sound.hint')}><Switch checked={settings.sound} onChange={(v) => setSetting('sound', v)} label={t('settings.sound.name')} /></Row>
        <Row id="s-kb" name={t('settings.keyboard.name')} hint={t('settings.keyboard.hint')}><Switch checked={settings.keyboard} onChange={(v) => setSetting('keyboard', v)} label={t('settings.keyboard.name')} /></Row>
        <Row id="s-fing" name={t('settings.fingers.name')} hint={t('settings.fingers.hint')}><Switch checked={settings.fingers} onChange={(v) => setSetting('fingers', v)} label={t('settings.fingers.name')} /></Row>
        <Row id="s-diff" name={t('settings.difficulty.name')} hint={t('settings.difficulty.hint')}>
          <Choice labelledBy="s-diff" value={settings.difficulty} onChange={(v) => setSetting('difficulty', v)} options={['relaxed', 'standard', 'strict'].map((k) => [k, t('settings.difficulty.' + k)])} />
        </Row>
        <Row id="s-break" name={t('settings.breaks.name')} hint={t('settings.breaks.hint')}>
          <Choice labelledBy="s-break" value={settings.breakReminder} onChange={(v) => setSetting('breakReminder', v)} options={[[0, t('settings.breaks.off')], [15, t('settings.breaks.m15')], [20, t('settings.breaks.m20')], [30, t('settings.breaks.m30')]]} />
        </Row>
      </Card>

      <SectionTitle>{t('settings.install.title')}</SectionTitle>
      <Card>
        <p className="mb-2 text-sm"><b>{t('settings.install.offline')}</b> {offline}</p>
        {pwa.standalone || pwa.installed ? <p className="text-sm text-ok">{t('settings.install.installed')}</p>
          : pwa.canInstall ? <Button variant="primary" onClick={pwa.install}>{t('settings.install.button')}</Button> : null}
        <details className="mt-3 text-sm text-dim"><summary className="cursor-pointer font-semibold text-fg">{t('settings.install.howTo')}</summary>
          <ul className="mt-2 grid gap-1.5 ps-5"><li>{t('settings.install.chrome')}</li><li>{t('settings.install.android')}</li><li>{t('settings.install.ios')}</li></ul>
          <p className="mt-2 text-xs text-faint">{t('settings.install.note')}</p></details>
      </Card>

      <SectionTitle>{t('settings.data.title')}</SectionTitle>
      <Card>
        <p className="mb-4 text-sm text-dim">{persistent ? t('settings.data.okText') : t('settings.data.blockedText')}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={doExport} data-testid="export"><DownloadIcon className="size-4" />{t('settings.data.export')}</Button>
          <Button onClick={() => fileRef.current && fileRef.current.click()}><UploadIcon className="size-4" />{t('settings.data.import')}</Button>
          <Button variant="danger" onClick={() => setResetOpen(true)} data-testid="reset">{t('settings.data.reset')}</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} aria-label={t('settings.data.import')} />
      </Card>

      <ConfirmDialog open={!!pendingImport} title={t('settings.data.importTitle')} onClose={closeImport} actions={[{ value: 'import', label: t('settings.data.importBtn'), danger: true }]}>
        <p>{pendingImport && t('settings.data.importText', { file: pendingImport.name })}</p>
      </ConfirmDialog>
      <ConfirmDialog open={resetOpen} title={t('settings.data.resetTitle')} onClose={closeReset} actions={[{ value: 'keep', label: t('settings.data.resetKeep') }, { value: 'all', label: t('settings.data.resetAll'), danger: true }]}>
        <p className="mb-2">{t('settings.data.resetIntro')}</p>
        <ul className="mb-3 grid list-disc gap-1 ps-5">{['r1', 'r2', 'r3', 'r4'].map((k) => <li key={k}>{t('settings.data.' + k)}</li>)}</ul>
        <p className="text-xs">{t('settings.data.resetTip')}</p>
      </ConfirmDialog>
    </>
  );
}
