// Activos de marca a partir de la tipografía real (Mona Sans, OFL):
// - src/data/wordmark.json → logotipo MAGIC WORLD (Expanded 125 · 800) en dos versiones:
//     line  = una línea (header, pie, héroe en escritorio)
//     stack = MAGIC sobre WORLD, justificadas al mismo ancho (móvil, carga)
// - public/favicon.svg, favicon-32.png, apple-touch-icon.png, icon-512.png
// - public/og/*.jpg → imágenes para compartir (1200×630) con fotos reales, una por prenda
// Uso: npm run brand (sin red: usa scripts/fonts y src/data/catalog.json)
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import fs from 'node:fs';

const PAPER = '#F0EFEB';
const INK = '#0D0D0D';
const RED = '#B0161F';
const r1 = (n) => Math.round(n * 10) / 10;
const fmt = (d) => d.replace(/-?\d+\.\d+/g, (m) => String(r1(parseFloat(m))));

const font = fontkit.openSync('scripts/fonts/mona-125-800.ttf');
const CAP = font.capHeight;
const CUT_AT = 0.44; // corte a 44 % de la altura de mayúscula (pasa sobre la barra de la G)

/** Glifos de una línea con tracking extra; devuelve trazados en coordenadas y-abajo. */
function glyphLine(text, tracking = 0, dy = 0) {
  const run = font.layout(text);
  let x = 0;
  const parts = [];
  run.glyphs.forEach((g, i) => {
    const p = g.path.scale(1, -1).translate(x, dy);
    if (p.commands.length) parts.push(p);
    x += run.positions[i].xAdvance + tracking;
  });
  return parts;
}
const bboxOf = (parts) => ({
  minX: Math.min(...parts.map((p) => p.bbox.minX)),
  maxX: Math.max(...parts.map((p) => p.bbox.maxX)),
  minY: Math.min(...parts.map((p) => p.bbox.minY)),
  maxY: Math.max(...parts.map((p) => p.bbox.maxY)),
});
function pack(parts, capTopY) {
  const b = bboxOf(parts);
  const W = b.maxX - b.minX;
  const H = b.maxY - b.minY;
  const cut = capTopY - b.minY + CAP * CUT_AT;
  return {
    viewBox: `0 0 ${r1(W)} ${r1(H)}`,
    width: r1(W),
    height: r1(H),
    ratio: Math.round((W / H) * 1000) / 1000,
    cut: r1(cut),
    cutRatio: Math.round((cut / H) * 10000) / 10000,
    d: parts.map((p) => fmt(p.translate(-b.minX, -b.minY).toSVG())).join(''),
  };
}

// ---------- Logotipo ----------
const line = pack(glyphLine('MAGIC WORLD'), -CAP);

const inkW = (parts) => { const b = bboxOf(parts); return b.maxX - b.minX; };
const world0 = glyphLine('WORLD');
const magic0 = glyphLine('MAGIC');
const tracking = (inkW(world0) - inkW(magic0)) / 4; // 5 letras → 4 espacios
const GAP = CAP * 0.2;
const magic = glyphLine('MAGIC', tracking);
const mB = bboxOf(magic);
const wB = bboxOf(world0);
const stackParts = [
  ...magic.map((p) => p.translate(-mB.minX, 0)),
  ...glyphLine('WORLD', 0, CAP + GAP).map((p) => p.translate(-wB.minX, 0)),
];
const stack = pack(stackParts, -CAP);

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/wordmark.json', JSON.stringify({ line, stack }, null, 2));
console.log('logotipo line', line.viewBox, 'ratio', line.ratio, '| stack', stack.viewBox, 'ratio', stack.ratio, 'tracking MAGIC', Math.round(tracking));

// ---------- Favicon (M) ----------
const mp = font.layout('M').glyphs[0].path.scale(1, -1);
const mb = mp.bbox;
const mw = mb.maxX - mb.minX;
const mh = mb.maxY - mb.minY;
const box = 1000;
const scale = (box * 0.62) / mw;
const tx = (box - mw * scale) / 2 - mb.minX * scale;
const ty = (box - mh * scale) / 2 - mb.minY * scale;
const md = mp.scale(scale, scale).translate(tx, ty).toSVG().replace(/-?\d+\.\d+/g, (m) => String(Math.round(parseFloat(m))));
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}"><rect width="${box}" height="${box}" fill="${INK}"/><path d="${md}" fill="${PAPER}"/><rect x="${Math.round(tx + mb.minX * scale)}" y="${Math.round(ty + (mb.minY + mh * CUT_AT) * scale)}" width="${Math.round(mw * scale)}" height="18" fill="${RED}"/></svg>`;
fs.writeFileSync('public/favicon.svg', favicon);
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(favicon)).resize(512, 512).png().toFile('public/icon-512.png');
console.log('favicon ok');

// ---------- Texto a trazados (instancias estáticas locales de Mona Sans) ----------
const fontCache = {};
function textPath(text, { wdth = 100, wght = 600, size = 24, tracking: tr = 0 } = {}) {
  const key = `${wdth}-${wght}`;
  fontCache[key] ??= fontkit.openSync(`scripts/fonts/mona-${key}.ttf`);
  const f = fontCache[key];
  const lay = f.layout(text);
  const s = size / f.unitsPerEm;
  let x = 0;
  let out = '';
  for (let i = 0; i < lay.glyphs.length; i++) {
    out += lay.glyphs[i].path.scale(s, -s).translate(x, 0).toSVG();
    x += lay.positions[i].xAdvance * s + tr;
  }
  return { d: fmt(out), width: x - tr };
}
/** Parte un texto en líneas que quepan en maxW. */
function wrap(text, opts, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && textPath(test, opts).width > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------- Imágenes para compartir ----------
const media = JSON.parse(fs.readFileSync('src/data/media.json', 'utf8'));
const { products } = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
const jpg = (id) => `public/shopify/${id}.jpg`;
const money = (n) => `$${n.toLocaleString('es-CO').replace(/,/g, '.')}`;
fs.rmSync('public/og', { recursive: true, force: true });
fs.mkdirSync('public/og', { recursive: true });

function markSvg(v, width, x, y, top = INK, bottom = INK, id = 'm') {
  const s = width / v.width;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <clipPath id="${id}t"><rect x="-10" y="-10" width="${v.width + 20}" height="${v.cut + 10}"/></clipPath>
    <clipPath id="${id}b"><rect x="-10" y="${v.cut}" width="${v.width + 20}" height="${v.height}"/></clipPath>
    <path d="${v.d}" fill="${top}" clip-path="url(#${id}t)"/>
    <path d="${v.d}" fill="${bottom}" clip-path="url(#${id}b)"/>
  </g>`;
}

async function ogHome() {
  const OW = 1200, OH = 630, IMG_H = 392;
  const panels = ['tactica-azul-modelo', 'hoodie-beige', 'chaqueton-gris-look'];
  const comps = [];
  for (let i = 0; i < 3; i++) {
    const m = media[panels[i]];
    const buf = await sharp(jpg(panels[i])).resize({ width: 400, height: IMG_H, fit: 'cover', position: m.bg === 'studio' ? 'top' : 'attention' }).toBuffer();
    comps.push({ input: buf, left: i * 400, top: 0 });
  }
  const W = 560;
  const s = W / stack.width;
  const y = IMG_H - stack.cut * s;
  const tag = textPath('CHAQUETAS, BUZOS Y ABRIGOS  ·  ENVÍO INCLUIDO', { wdth: 100, wght: 600, size: 18, tracking: 2.2 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}">
    ${markSvg(stack, W, (OW - W) / 2, y, PAPER, INK, 'h')}
    <path transform="translate(${(OW - tag.width) / 2} ${OH - 26})" d="${tag.d}" fill="${INK}"/>
  </svg>`;
  comps.push({ input: Buffer.from(svg), left: 0, top: 0 });
  await sharp({ create: { width: OW, height: OH, channels: 3, background: PAPER } }).composite(comps).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og/og-home.jpg');
  console.log('og-home ok');
}

async function ogProduct(p) {
  const OW = 1200, OH = 630, PW = 520;
  const id = p.colors[0].images[0].id;
  const m = media[id];
  const comps = [];
  if (m.bg === 'white') {
    const img = await sharp(jpg(id)).resize({ width: PW, height: OH, fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer();
    const tinted = await sharp({ create: { width: PW, height: OH, channels: 3, background: PAPER } }).composite([{ input: img, blend: 'multiply' }]).png().toBuffer();
    comps.push({ input: tinted, left: 0, top: 0 });
  } else {
    const img = await sharp(jpg(id)).resize({ width: PW, height: OH, fit: 'cover', position: 'top' }).toBuffer();
    comps.push({ input: img, left: 0, top: 0 });
  }
  const X = 600, MAXW = 560;
  const nameOpts = { wdth: 75, wght: 800, size: 70 };
  const lines = wrap(p.name.toUpperCase(), nameOpts, MAXW).slice(0, 4);
  let y = 205;
  const names = lines.map((l) => { const t = textPath(l, nameOpts); const s = `<path transform="translate(${X} ${y})" d="${t.d}" fill="${INK}"/>`; y += 72; return s; }).join('');
  const priceTxt = textPath(p.price ? `${money(p.price)}  ·  ENVÍO INCLUIDO` : 'PRECIO POR WHATSAPP', { wdth: 100, wght: 600, size: 22, tracking: 1.6 });
  const cta = textPath('PEDIDOS POR WHATSAPP', { wdth: 100, wght: 600, size: 17, tracking: 2.4 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}">
    ${markSvg(line, 300, X, 70, INK, INK, 'p')}
    ${names}
    <path transform="translate(${X} ${y + 26})" d="${priceTxt.d}" fill="${INK}"/>
    <rect x="${X}" y="${OH - 96}" width="${MAXW}" height="2" fill="${RED}"/>
    <path transform="translate(${X} ${OH - 58})" d="${cta.d}" fill="${INK}"/>
  </svg>`;
  comps.push({ input: Buffer.from(svg), left: 0, top: 0 });
  await sharp({ create: { width: OW, height: OH, channels: 3, background: PAPER } }).composite(comps).jpeg({ quality: 86, mozjpeg: true }).toFile(`public/og/og-${p.slug}.jpg`);
}

await ogHome();
for (const p of products) await ogProduct(p);
console.log(`og de ${products.length} prendas ok`);
