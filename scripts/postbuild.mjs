// Runs after "vite build" (and after build-local): fills the service worker
// placeholders with the real list of built files and a content-based version.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const dist = new URL('../' + (process.env.DIST_DIR || 'dist') + '/', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(dist)
  .map((p) => relative(dist, p).split(sep).join('/'))
  .filter((f) => f !== 'sw.js' && !f.endsWith('.map'))
  .sort();

const hash = createHash('sha256');
files.forEach((f) => { hash.update(f); hash.update(readFileSync(join(dist, f))); });
const version = 'typecsf-' + hash.digest('hex').slice(0, 10);

const list = ['./', ...files];
const swPath = join(dist, 'sw.js');
let sw = readFileSync(swPath, 'utf8');
sw = sw.replace("'__CACHE_VERSION__'", JSON.stringify(version)).replace("'__PRECACHE_LIST__'", JSON.stringify(list));
writeFileSync(swPath, sw);
console.log(`postbuild: ${list.length} files precached, cache ${version}`);
