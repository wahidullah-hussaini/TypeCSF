/* End-to-end tests in a real Chromium (Playwright). Run:  npm run test:e2e
   It serves two builds of the app:
     dist/       built WITHOUT e-mail keys  -> proves the form is honest when not configured
     dist-test/  built with FAKE EmailJS ids -> proves the form with a MOCKED EmailJS endpoint
   Nothing here talks to the real EmailJS service. */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { FLAT } = await import('../src/features/progress/progress.js');
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en/translation.json'), 'utf8'));
const tr = (l) => JSON.parse(fs.readFileSync(path.join(root, `src/locales/${l}/translation.json`), 'utf8'));

function build(distDir, env) {
  execFileSync(process.execPath, [path.join(root, 'scripts/build-local.mjs')], { cwd: root, env: { ...process.env, DIST_DIR: distDir, ...env }, stdio: 'ignore' });
}
if (!fs.existsSync(path.join(root, 'dist/index.html')) || process.env.REBUILD) build('dist', {});
build('dist-test', { VITE_EMAILJS_SERVICE_ID: 'service_test', VITE_EMAILJS_TEMPLATE_ID: 'template_test', VITE_EMAILJS_PUBLIC_KEY: 'public_test' });

const A = await serve(path.join(root, 'dist'));
const B = await serve(path.join(root, 'dist-test'));
const browser = await chromium.launch({ args: ['--no-sandbox'] });

const results = [];
let consoleProblems = [];
async function test(name, fn) {
  try { await fn(); results.push([name, true]); console.log('  ok   ' + name); }
  catch (e) { results.push([name, false, e]); console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').slice(0, 4).join('\n       ')); }
}
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || 'not equal') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)); };
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

async function open(base, { lang = 'en', width = 1280, height = 800, hash = '', ctxOpts = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'allow', ...ctxOpts });
  if (lang) await ctx.addInitScript((l) => { try { if (!sessionStorage.getItem('__init')) { localStorage.setItem('typecsf.lang', l); sessionStorage.setItem('__init', '1'); } } catch (e) {} }, lang);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => consoleProblems.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleProblems.push('console.error: ' + m.text().slice(0, 200)); });
  await page.goto(base.url + (hash ? '#/' + hash : ''));
  await page.waitForSelector('header');
  return { ctx, page };
}
const typeAll = async (page, text) => { await page.click('[data-testid=typing-wrap]'); await page.keyboard.type(text, { delay: 2 }); };
const drill = FLAT[0].lesson.drill;

console.log('\nLanguages, direction and persistence');
for (const [code, dir, label] of [['en', 'ltr', 'English'], ['fa', 'rtl', 'دری'], ['ps', 'rtl', 'پښتو']]) {
  await test(`${code}: <html lang dir> and switcher label`, async () => {
    const { ctx, page } = await open(A, { lang: code });
    eq(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir]), [code, dir]);
    ok((await page.textContent(`[data-testid=language-switcher] [data-lang=${code}]`)).trim() === label, 'label');
    await ctx.close();
  });
}
await test('switcher changes language live and it persists after reload', async () => {
  const { ctx, page } = await open(A, { lang: 'en', hash: '' });
  await page.click('[data-lang=fa]');
  eq(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir]), ['fa', 'rtl']);
  ok((await page.textContent('#main-page h1')).includes('علوم کامپیوتر'), 'home h1 is Dari');
  await page.click('[data-lang=ps]');
  eq(await page.evaluate(() => document.documentElement.dir), 'rtl');
  ok((await page.textContent('#main-page h1')).includes('کمپيوټر'), 'home h1 is Pashto');
  await page.reload(); await page.waitForSelector('header');
  eq(await page.evaluate(() => document.documentElement.lang), 'ps', 'persisted');
  await page.click('[data-lang=en]');
  eq(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir]), ['en', 'ltr']);
  ok((await page.title()).includes('TypeCSF'));
  await ctx.close();
});
await test('browser language Dari/Pashto is detected on first visit', async () => {
  const { ctx, page } = await open(A, { lang: null, ctxOpts: { locale: 'fa-AF' } });
  eq(await page.evaluate(() => document.documentElement.lang), 'fa');
  await ctx.close();
});

console.log('\nPages, layout and console');
for (const lang of ['en', 'fa', 'ps']) {
  await test(`${lang}: every page renders, no horizontal scroll at 360px, no missing translations`, async () => {
    const { ctx, page } = await open(A, { lang, width: 360, height: 740 });
    for (const r of ['', 'learn', 'practice', 'games', 'quiz', 'dashboard', 'settings', 'about', 'contact', 'nope']) {
      await page.goto(A.url + '#/' + r); await page.waitForTimeout(120);
      const info = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, raw: /\b(home|nav|learn|practice|games|quiz|dashboard|settings|about|contact|results|footer|wa|dev)\.[a-zA-Z]+\.?[a-zA-Z.]*\b/.test(document.body.innerText) }));
      ok(info.overflow <= 1, `${r || 'home'} overflows by ${info.overflow}px`);
      ok(!info.raw, `${r || 'home'} shows a raw translation key`);
    }
    await ctx.close();
  });
}

console.log('\nTyping, scoring and persistence');
await test('lesson: typing the drill completes it, shows results, saves progress, updates the dashboard', async () => {
  const { ctx, page } = await open(A, { hash: 'learn' });
  await typeAll(page, drill);
  await page.waitForSelector('[data-testid=results]');
  const wpm = Number((await page.textContent('#resultWpm')).replace(/\D/g, ''));
  ok(wpm > 0, 'WPM shown');
  eq((await page.textContent('#resultAcc')).trim(), '100%');
  eq((await page.textContent('#progressChip')).replace(/\s/g, ''), '1/30');
  await page.waitForTimeout(600); // saving is debounced by 300 ms
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('typecsf.v2')));
  eq(Object.keys(saved.progress.done).length, 1);
  ok(saved.history.length === 1 && saved.history[0].acc === 100);
  await page.goto(A.url + '#/dashboard');
  ok((await page.textContent('[data-testid=dash-cards]')).includes('1'), 'dashboard shows data');
  await page.reload(); await page.waitForSelector('#progressChip');
  eq((await page.textContent('#progressChip')).replace(/\s/g, ''), '1/30', 'persists across reload');
  await ctx.close();
});
await test('a mistake lowers accuracy and is still counted after Backspace', async () => {
  const { ctx, page } = await open(A, { hash: 'practice' });
  const text = 'abc def ghi jkl mno';
  await page.fill('#custom-text', text);
  await page.click('button:has-text("Practise this text")');
  await page.waitForSelector('[data-testid=typing-wrap]');
  await page.click('[data-testid=typing-wrap]');
  await page.keyboard.type('x', { delay: 5 });
  eq((await page.textContent('#statErrors')).trim(), '1');
  await page.keyboard.press('Backspace');
  eq((await page.textContent('#statErrors')).trim(), '1', 'still 1 after Backspace');
  await page.keyboard.type(text, { delay: 5 });
  await page.waitForSelector('[data-testid=results]');
  eq((await page.textContent('#resultErrors')).trim(), '1');
  const acc = Number((await page.textContent('#resultAcc')).replace(/\D/g, ''));
  eq(acc, Math.round(100 * text.length / (text.length + 1)), 'accuracy = correct keystrokes / all keystrokes');
  await ctx.close();
});
await test('switching language in the middle of a run keeps the run and the progress', async () => {
  const { ctx, page } = await open(A, { hash: 'learn' });
  const half = Math.floor(drill.length / 2);
  await typeAll(page, drill.slice(0, half));
  await page.click('[data-lang=fa]');
  await page.click('[data-lang=ps]');
  await page.click('[data-lang=en]');
  const typed = await page.evaluate(() => document.querySelectorAll('[data-testid=typing-wrap] .ch-correct, [data-testid=typing-wrap] [data-state=correct]').length);
  ok(await page.$('[data-testid=results]') === null, 'not finished yet');
  await page.click('[data-testid=typing-wrap]');
  await page.keyboard.type(drill.slice(half), { delay: 2 });
  await page.waitForSelector('[data-testid=results]', { timeout: 5000 });
  eq((await page.textContent('#resultAcc')).trim(), '100%', 'the whole drill counted as one run');
  await ctx.close();
});
await test('navigating to another page and back keeps the half-typed run', async () => {
  const { ctx, page } = await open(A, { hash: 'learn' });
  const half = Math.floor(drill.length / 2);
  await typeAll(page, drill.slice(0, half));
  await page.goto(A.url + '#/about'); await page.waitForTimeout(150);
  await page.goto(A.url + '#/learn'); await page.waitForTimeout(150);
  await page.click('[data-testid=typing-wrap]');
  await page.keyboard.type(drill.slice(half), { delay: 2 });
  await page.waitForSelector('[data-testid=results]', { timeout: 5000 });
  eq((await page.textContent('#resultAcc')).trim(), '100%');
  await ctx.close();
});
await test('on-screen keyboard highlights the next key and finger guidance is shown', async () => {
  const { ctx, page } = await open(A, { hash: 'learn' });
  await page.click('[data-testid=typing-wrap]');
  const first = drill[0];
  const code = await page.evaluate(() => (document.querySelector('.key.is-next') || {}).dataset && document.querySelector('.key.is-next').dataset.code);
  ok(code, 'a next key is highlighted');
  eq(code, 'Key' + first.toUpperCase(), 'highlight is the first letter of the drill');
  ok(await page.$('[data-finger]'), 'finger data present');
  await page.keyboard.type(first, { delay: 5 });
  const code2 = await page.evaluate(() => document.querySelector('.key.is-next').dataset.code);
  ok(code2 !== code || drill[1] === first, 'highlight moves to the next key');
  await ctx.close();
});
await test('handbook is locked until all lessons are done', async () => {
  const { ctx, page } = await open(A, { hash: 'learn' });
  ok((await page.textContent('body')).includes(en.learn.finishAll), 'lock hint in sidebar');
  await ctx.close();
});
await test('practice and games start a run on the typing page', async () => {
  const { ctx, page } = await open(A, { hash: 'practice' });
  await page.click('[data-testid=practice-words]');
  await page.waitForSelector('[data-testid=typing-wrap]');
  ok((await page.evaluate(() => location.hash)) === '#/learn');
  await page.goto(A.url + '#/games'); await page.click('[data-testid=game-sprint]');
  ok((await page.evaluate(() => location.hash)) === '#/learn');
  await ctx.close();
});
await test('quiz: answer 5 questions, see explanations, result saved', async () => {
  const { ctx, page } = await open(A, { hash: 'quiz' });
  await page.click('[data-testid=quiz-start]');
  for (let i = 0; i < 5; i++) { await page.click('[data-testid=quiz-opt-0]'); await page.click('[data-testid=quiz-next]'); }
  await page.waitForSelector('[data-testid=quiz-done]');
  await page.waitForTimeout(600);
  eq((await page.evaluate(() => JSON.parse(localStorage.getItem('typecsf.v2')).quizzes.answered)), 5);
  await ctx.close();
});
await test('settings: theme, reset and export work', async () => {
  const { ctx, page } = await open(A, { hash: 'settings' });
  await page.click('button:has-text("Dark")');
  eq(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-testid=export]')]);
  ok(dl.suggestedFilename().startsWith('typecsf-progress'));
  await ctx.close();
});
await test('reduced motion: html gets data-motion=reduce and the WhatsApp pulse stops', async () => {
  const { ctx, page } = await open(A, { ctxOpts: { reducedMotion: 'reduce' } });
  eq(await page.evaluate(() => document.documentElement.dataset.motion), 'reduce');
  const anim = await page.evaluate(() => { const el = document.querySelector('a[href*="wa.me"] span.bg-wa'); return el ? getComputedStyle(el).animationName : 'none'; });
  eq(anim, 'none');
  await ctx.close();
});

console.log('\nDeveloper profile and WhatsApp');
for (const lang of ['en', 'fa', 'ps']) {
  await test(`${lang}: floating WhatsApp button link, translated message and tooltip`, async () => {
    const { ctx, page } = await open(A, { lang });
    const a = page.locator('[data-testid=wa-button]');
    const href = await a.getAttribute('href');
    eq(decodeURIComponent(href.split('?text=')[1]), tr(lang).wa.message);
    eq(await a.getAttribute('target'), '_blank');
    ok((await a.getAttribute('rel')).includes('noopener'));
    ok((await a.getAttribute('aria-label')).length > 5);
    ok((await a.textContent()).includes(tr(lang).wa.tooltip), 'tooltip text present');
    const box = await a.boundingBox(); ok(box.width >= 44 && box.height >= 44, 'touch target >= 44px');
    await ctx.close();
  });
}
await test('about page: developer facts, photo loads, hover and keyboard focus effects exist', async () => {
  const { ctx, page } = await open(A, { hash: 'about' });
  const card = page.locator('[data-testid=developer-card]');
  const text = await card.textContent();
  for (const s of ['Wahidullah Hussaini', 'Developer of TypeCSF', 'Kabul Education University', 'TypeCSF', 'wahidullahhussaini1383@gmail.com', '+93796883671']) ok(text.includes(s), 'missing: ' + s);
  await page.waitForFunction(() => { const i = document.querySelector('[data-testid=developer-card] img'); return i && i.complete && i.naturalWidth > 100; }, null, { timeout: 5000 });
  const before = await card.boundingBox();
  await card.hover(); await page.waitForTimeout(450);
  const after = await card.boundingBox();
  ok(after.y < before.y, 'card lifts on hover');
  ok(await page.evaluate(() => (() => { const cs = getComputedStyle(document.querySelector('[data-testid=developer-card] img')); return cs.scale !== 'none' || cs.transform !== 'none'; })()), 'photo zooms on hover');
  await ctx.close();
});

console.log('\nSuggestion form (not configured build)');
await test('without EmailJS keys the form says so and sends nothing', async () => {
  const { ctx, page } = await open(A, { hash: 'contact' });
  let calls = 0; await page.route('**/api.emailjs.com/**', (r) => { calls++; r.abort(); });
  await page.waitForSelector('[data-testid=not-configured]');
  await page.fill('#sf-message', 'This is a valid suggestion message.'); await page.check('#sf-consent');
  await page.click('[data-testid=send-button]'); await page.waitForTimeout(400);
  eq(calls, 0);
  ok(await page.$('[data-testid=form-success]') === null, 'no success shown');
  eq(await page.inputValue('#sf-message'), 'This is a valid suggestion message.', 'text preserved');
  await ctx.close();
});

console.log('\nSuggestion form (mocked EmailJS)');
async function fillForm(page, over = {}) {
  await page.fill('#sf-name', over.name ?? 'Ali Ahmadi');
  await page.fill('#sf-email', over.email ?? 'ali@example.com');
  await page.selectOption('#sf-category', over.category ?? 'bug');
  await page.fill('#sf-subject', over.subject ?? 'Keyboard bug');
  await page.fill('#sf-message', over.message ?? 'The R key is highlighted on the wrong finger.');
  if (over.consent !== false) await page.check('#sf-consent');
}
await test('validation: empty form shows errors, nothing is sent', async () => {
  const { ctx, page } = await open(B, { hash: 'contact' });
  let calls = 0; await page.route('**/api.emailjs.com/**', (r) => { calls++; r.fulfill({ status: 200, body: 'OK' }); });
  await page.click('[data-testid=send-button]');
  await page.waitForSelector('#sf-message-err');
  ok((await page.textContent('#sf-message-err')).length > 3);
  await page.fill('#sf-email', 'bad'); await page.fill('#sf-message', 'long enough message here'); await page.click('[data-testid=send-button]');
  await page.waitForSelector('#sf-email-err');
  ok(await page.$('#sf-consent-err'), 'consent required');
  eq(calls, 0);
  await ctx.close();
});
await test('success: payload is correct, recipient is not sent, success shown only after confirmation', async () => {
  const { ctx, page } = await open(B, { hash: 'contact', lang: 'fa' });
  let body = null;
  await page.route('**/api.emailjs.com/**', async (r) => { body = JSON.parse(r.request().postData()); await new Promise((x) => setTimeout(x, 250)); r.fulfill({ status: 200, body: 'OK' }); });
  await fillForm(page);
  await page.click('[data-testid=send-button]');
  await page.waitForTimeout(100);
  ok(await page.$('[data-testid=form-success]') === null, 'no success before the service answers');
  ok(await page.isDisabled('[data-testid=send-button]'), 'button disabled while sending');
  await page.waitForSelector('[data-testid=form-success]');
  eq(body.service_id, 'service_test'); eq(body.template_id, 'template_test'); eq(body.user_id, 'public_test');
  const p = body.template_params;
  eq(p.from_name, 'Ali Ahmadi'); eq(p.sender_email, 'ali@example.com'); eq(p.category, 'Bug report'); eq(p.subject, 'Keyboard bug');
  eq(p.language, 'Dari'); ok(/^\d{4}-\d\d-\d\dT/.test(p.submitted_at)); ok(p.message.includes('R key'));
  ok(!JSON.stringify(body).includes('wahidullahhussaini1383'), 'recipient address is never in the browser payload');
  eq(await page.inputValue('#sf-message'), '', 'form cleared after success');
  await ctx.close();
});
await test('server error: shows an error, keeps the typed text, allows retry', async () => {
  const { ctx, page } = await open(B, { hash: 'contact' });
  let calls = 0; await page.route('**/api.emailjs.com/**', (r) => { calls++; r.fulfill({ status: 500, body: 'fail' }); });
  await fillForm(page, { message: 'My careful message that must not be lost.' });
  await page.click('[data-testid=send-button]');
  await page.waitForSelector('[role=alert]');
  ok(await page.$('[data-testid=form-success]') === null);
  eq(await page.inputValue('#sf-message'), 'My careful message that must not be lost.');
  eq(await page.inputValue('#sf-name'), 'Ali Ahmadi');
  ok(!(await page.isDisabled('[data-testid=send-button]')), 'can retry');
  eq(calls, 1);
  await ctx.close();
});
await test('network failure is handled', async () => {
  const { ctx, page } = await open(B, { hash: 'contact' });
  await page.route('**/api.emailjs.com/**', (r) => r.abort());
  await fillForm(page); await page.click('[data-testid=send-button]');
  await page.waitForSelector('[role=alert]');
  eq(await page.inputValue('#sf-message'), 'The R key is highlighted on the wrong finger.');
  await ctx.close();
});
await test('double submit sends exactly one request; a second send within 60 s is blocked', async () => {
  const { ctx, page } = await open(B, { hash: 'contact' });
  let calls = 0; await page.route('**/api.emailjs.com/**', async (r) => { calls++; await new Promise((x) => setTimeout(x, 300)); r.fulfill({ status: 200, body: 'OK' }); });
  await fillForm(page);
  await page.dblclick('[data-testid=send-button]'); await page.keyboard.press('Enter');
  await page.waitForSelector('[data-testid=form-success]');
  eq(calls, 1, 'one request');
  await fillForm(page); await page.click('[data-testid=send-button]'); await page.waitForTimeout(400);
  eq(calls, 1, 'rate limit blocks the second message');
  ok(await page.$('[role=alert]'), 'user told to wait');
  await ctx.close();
});
await test('honeypot filled by a bot: nothing is sent', async () => {
  const { ctx, page } = await open(B, { hash: 'contact' });
  let calls = 0; await page.route('**/api.emailjs.com/**', (r) => { calls++; r.fulfill({ status: 200, body: 'OK' }); });
  await fillForm(page);
  await page.evaluate(() => { const i = document.querySelector('input[name=website]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, 'http://spam'); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('[data-testid=send-button]'); await page.waitForTimeout(400);
  eq(calls, 0);
  await ctx.close();
});

console.log('\nPWA and offline');
await test('service worker installs and the app works offline after the first visit', async () => {
  const { ctx, page } = await open(A, { hash: 'practice' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller || true);
  await page.reload(); await page.waitForTimeout(600);
  ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'page controlled by the service worker');
  await ctx.setOffline(true);
  await page.reload(); await page.waitForSelector('header', { timeout: 8000 });
  await page.goto(A.url + '#/learn');
  await page.waitForSelector('[data-testid=typing-wrap]');
  await typeAll(page, drill);
  await page.waitForSelector('[data-testid=results]');
  await ctx.setOffline(false); await ctx.close();
});
await test('manifest is valid and icons exist', async () => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'dist/manifest.webmanifest'), 'utf8'));
  ok(m.name && m.start_url && m.display === 'standalone' && m.icons.length >= 2);
  m.icons.forEach((i) => ok(fs.existsSync(path.join(root, 'dist', i.src.replace(/^\.?\//, ''))), i.src));
});

console.log('\nConsole');
await test('no console errors or uncaught exceptions during the whole run', async () => {
  const real = consoleProblems.filter((p) => !/Failed to load resource|net::ERR|api\.emailjs\.com|status of 500/.test(p));
  eq(real, [], 'console problems');
});

await browser.close(); A.server.close(); B.server.close();
const failed = results.filter((r) => !r[1]);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
