// QA: lista las clases definidas en src/styles/*.css que no aparecen en ningún
// .astro/.ts de src/ (ni en las clases que arma el JS). Solo informa; no borra.
// Uso: node scripts/unused-css.mjs
import fs from 'node:fs';
import path from 'node:path';

const walk = (d, out = []) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const files = walk('src');
const css = files.filter((f) => f.endsWith('.css'));
const code = files.filter((f) => /\.(astro|ts|mjs|js)$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const defined = new Set();
for (const f of css) {
  const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of src.matchAll(/\.([a-z][a-z0-9_-]*)/gi)) defined.add(m[1]);
}
// Clases que genera el propio navegador/Lenis o que se añaden por estado.
const runtime = new Set(['js', 'mo', 'rm', 'intro', 'lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling', 'is-in', 'is-on', 'is-active', 'is-visible', 'is-closing', 'is-pinned', 'is-bump', 'is-hovering', 'has-float', 'is-playing', 'fallback-show', 'opt--invalid', 'toast', 'toast__msg', 'toast__btn', 'fly', 'bag__info', 'bag__name', 'bag__meta', 'bag__row', 'bag__row--top', 'bag__price', 'bag__remove', 'bag__thumb', 'qty', 'opt__item', 'opt__item--color', 'opt__item--size', 'opt__swatch', 'search__name', 'search__tag', 'search__thumb', 'frame', 'sr-only']);
const unused = [...defined].filter((c) => !runtime.has(c) && !new RegExp(`['"\\s.\`]${c.replace(/[-]/g, '\\-')}(?![a-z0-9_-])`, 'i').test(code));
console.log(unused.length ? `Clases sin uso (${unused.length}):\n  ${unused.sort().join('\n  ')}` : 'Sin clases huérfanas.');
