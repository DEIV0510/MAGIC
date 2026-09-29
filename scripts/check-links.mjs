// QA: recorre dist/ y verifica que todo enlace e imagen interna exista.
// Uso: npm run build && node scripts/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = 'dist';
const files = [];
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
  }
};
walk(root);

const refs = new Map();
const external = new Set();
const add = (u, from) => {
  if (!u) return;
  if (/^https?:/.test(u)) {
    external.add(u.replace(/\?.*/, '?…'));
    return;
  }
  if (/^(mailto:|tel:|data:|#|javascript:)/.test(u)) return;
  const clean = u.split('#')[0].split('?')[0];
  if (!clean) return;
  if (!refs.has(clean)) refs.set(clean, new Set());
  refs.get(clean).add(from);
};

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const from = f.split(path.sep).join('/');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) add(m[1], from);
  for (const m of html.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) add(part.trim().split(/\s+/)[0], from);
  }
  for (const m of html.matchAll(/url\(([^)]+)\)/g)) add(m[1].replace(/['"]/g, ''), from);
}

const missing = [];
for (const [u, from] of refs) {
  let p = path.join(root, decodeURIComponent(u));
  if (u.endsWith('/')) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) missing.push(`${u}  ← ${[...from].slice(0, 2).join(', ')}`);
}

console.log(`páginas: ${files.length} · referencias internas: ${refs.size} · rotas: ${missing.length}`);
for (const m of missing) console.log('  ROTA', m);
console.log('externos:', [...external].join('  '));
process.exit(missing.length ? 1 : 0);
