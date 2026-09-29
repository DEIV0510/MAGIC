// Reduce Mona Sans a lo que usa el sitio: glifos del español + puntuación,
// eje de peso 400–800 (el de ancho completo, 75–125). Nombre con hash para
// caché inmutable; genera src/styles/font.css y src/data/font.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import subsetFont from 'subset-font';

const SRC = 'scripts/fonts/mona-sans-latin-full.woff2';
const OUT_DIR = 'public/fonts';

let chars = '';
for (let c = 0x20; c <= 0x7e; c++) chars += String.fromCharCode(c); // ASCII imprimible
for (let c = 0xa0; c <= 0xff; c++) chars += String.fromCharCode(c); // Latin-1: á é í ó ú ñ ü ¿ ¡ « » · ©
chars += [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2022, 0x20ac, 0x2122, 0x2192, 0x2190].map((c) => String.fromCharCode(c)).join('');

const input = fs.readFileSync(SRC);
const out = await subsetFont(input, chars, {
  targetFormat: 'woff2',
  variationAxes: { wght: { min: 400, max: 800 }, wdth: { min: 75, max: 125 } },
});

const hash = crypto.createHash('md5').update(out).digest('hex').slice(0, 8);
const name = `mona-sans.${hash}.woff2`;
for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith('.woff2')) fs.rmSync(path.join(OUT_DIR, f));
fs.writeFileSync(path.join(OUT_DIR, name), out);

fs.writeFileSync(
  'src/styles/font.css',
  `/* Generado por scripts/subset-font.mjs — no editar a mano. */
@font-face {
  font-family: 'Mona Sans';
  src: url('/fonts/${name}') format('woff2');
  font-weight: 400 800;
  font-stretch: 75% 125%;
  font-style: normal;
  font-display: swap;
}
`,
);
fs.writeFileSync('src/data/font.json', JSON.stringify({ href: `/fonts/${name}` }, null, 2) + '\n');
console.log(`${name}: ${(input.length / 1024).toFixed(1)} KB → ${(out.length / 1024).toFixed(1)} KB (${[...new Set(chars)].length} caracteres)`);
