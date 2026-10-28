// Offline build used when "npm install vite" is not possible (for example on a
// machine without internet access to the npm registry). It needs only the
// packages react, react-dom, esbuild and tailwindcss and produces the same
// dist/ folder layout as "npm run build" (Vite). The normal route is
// "npm run build"; this script exists so the project can be built and tested
// anywhere esbuild and tailwindcss are present.
import { build, transform } from 'esbuild';
import { compile } from 'tailwindcss';
import { createRequire } from 'node:module';
import {
  copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = join(root, process.env.DIST_DIR || 'dist');
const require = createRequire(join(root, 'package.json'));

/* ---- environment (.env + process.env, VITE_ keys only) ------------------- */
const env = {};
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  readFileSync(envFile, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = /^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}
Object.keys(process.env).forEach((k) => { if (k.startsWith('VITE_')) env[k] = process.env[k]; });
const KNOWN = ['VITE_EMAILJS_SERVICE_ID', 'VITE_EMAILJS_TEMPLATE_ID', 'VITE_EMAILJS_PUBLIC_KEY', 'VITE_CONTACT_EMAIL', 'VITE_WHATSAPP_NUMBER'];
/* Like Vite, replace the whole import.meta.env object (the app reads it through an alias). */
const metaEnv = { MODE: 'production', PROD: true, DEV: false, BASE_URL: './' };
KNOWN.forEach((k) => { metaEnv[k] = env[k] || ''; });
const define = { 'import.meta.env': JSON.stringify(metaEnv) };

/* ---- helpers --------------------------------------------------------------- */
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const short = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'assets'), { recursive: true });

/* ---- JavaScript ----------------------------------------------------------- */
const js = await build({
  entryPoints: [join(root, 'src/main.jsx')],
  bundle: true,
  write: false,
  format: 'esm',
  target: 'es2020',
  minify: true,
  jsx: 'automatic',
  define: { ...define, 'process.env.NODE_ENV': '"production"' },
  loader: { '.css': 'empty', '.jpg': 'dataurl' },
  nodePaths: [join(root, 'node_modules')],
  logLevel: 'warning',
});
const jsText = js.outputFiles[0].text;
const jsName = `assets/index-${short(jsText)}.js`;
writeFileSync(join(dist, jsName), jsText);

/* ---- CSS (Tailwind v4 compiler API) --------------------------------------- */
const sources = [...walk(join(root, 'src')), join(root, 'index.html')].filter((f) => /\.(jsx?|html)$/.test(f));
const candidates = new Set();
sources.forEach((f) => {
  readFileSync(f, 'utf8').split(/[\s"'`]+/).forEach((tok) => { if (tok && tok.length < 200) candidates.add(tok); });
});
const cssEntry = join(root, 'src/index.css');
const compiler = await compile(readFileSync(cssEntry, 'utf8'), {
  base: dirname(cssEntry),
  onDependency: () => {},
  loadStylesheet: async (id, base) => {
    let path;
    if (id === 'tailwindcss') path = join(root, 'node_modules/tailwindcss/index.css');
    else if (id.startsWith('tailwindcss/')) path = join(root, 'node_modules', id) + (id.endsWith('.css') ? '' : '.css');
    else if (id.startsWith('.')) path = resolve(base, id);
    else path = require.resolve(id);
    return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
  },
  loadModule: async () => { throw new Error('plugins are not supported by build-local'); },
});
const rawCss = compiler.build([...candidates]);
const minCss = (await transform(rawCss, { loader: 'css', minify: true, target: 'es2020' })).code;
const cssName = `assets/index-${short(minCss)}.css`;
writeFileSync(join(dist, cssName), minCss);

/* ---- public files and index.html ----------------------------------------- */
cpSync(join(root, 'public'), dist, { recursive: true });
let html = readFileSync(join(root, 'index.html'), 'utf8');
html = html
  .replace('<script type="module" src="/src/main.jsx"></script>',
    `<link rel="stylesheet" href="./${cssName}">\n<script type="module" crossorigin src="./${jsName}"></script>`)
  .replace(/(href|src)="\/(?!\/)/g, '$1="./');
writeFileSync(join(dist, 'index.html'), html);

execFileSync(process.execPath, [join(root, 'scripts/postbuild.mjs')], { stdio: 'inherit' });
console.log(`build-local: ${jsName} (${(jsText.length / 1024).toFixed(0)} KB), ${cssName} (${(minCss.length / 1024).toFixed(0)} KB)`);
