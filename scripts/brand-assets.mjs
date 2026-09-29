// Activos de marca a partir de la tipografía real (Mona Sans, OFL):
// - src/data/wordmark.json → trazados del logotipo MAGIC (Expanded 125 · 800)
// - public/favicon.svg, favicon-32.png, apple-touch-icon.png
// - public/og/*.jpg → imágenes para compartir (1200×630) con fotos reales
// Uso: node scripts/brand-assets.mjs (sin red: usa scripts/fonts)
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import fs from 'node:fs';

const PAPER = '#F0EFEB';
const INK = '#0D0D0D';
const RED = '#B0161F';
const r1 = (n) => Math.round(n * 10) / 10;

// ---------- Wordmark ----------
const font = fontkit.openSync('scripts/fonts/mona-125-800-MAGIC.ttf');
const run = font.layout('MAGIC');
let penX = 0;
const letters = [];
for (let i = 0; i < run.glyphs.length; i++) {
  const g = run.glyphs[i];
  const p = g.path.scale(1, -1).translate(penX, 0);
  letters.push({ char: 'MAGIC'[i], path: p, bbox: p.bbox, adv: run.positions[i].xAdvance, x: penX });
  penX += run.positions[i].xAdvance;
}
const minX = Math.min(...letters.map((l) => l.bbox.minX));
const maxX = Math.max(...letters.map((l) => l.bbox.maxX));
const minY = Math.min(...letters.map((l) => l.bbox.minY));
const maxY = Math.max(...letters.map((l) => l.bbox.maxY));
const W = maxX - minX;
const H = maxY - minY;
const toD = (p) => p.translate(-minX, -minY).toSVG().replace(/-?\d+\.\d+/g, (m) => String(r1(parseFloat(m))));
const d = letters.map((l) => toD(l.path)).join('');
const baseline = -minY; // y de la línea base en el sistema trasladado
const capTop = baseline - font.capHeight;
// Corte: 44 % desde la altura de mayúscula (pasa por encima de la barra de la G).
const cut = capTop + font.capHeight * 0.44;
const wordmark = {
  viewBox: `0 0 ${r1(W)} ${r1(H)}`,
  width: r1(W),
  height: r1(H),
  ratio: r1((W / H) * 1000) / 1000,
  cut: r1(cut),
  cutRatio: Math.round((cut / H) * 10000) / 10000,
  d,
  letters: letters.map((l) => ({ char: l.char, d: toD(l.path), x: r1(l.bbox.minX - minX), w: r1(l.bbox.maxX - l.bbox.minX) })),
};
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/wordmark.json', JSON.stringify(wordmark, null, 2));
console.log('wordmark', wordmark.viewBox, 'ratio', wordmark.ratio, 'cutRatio', wordmark.cutRatio);

// ---------- Favicon (M) ----------
const fm = fontkit.openSync('scripts/fonts/mona-125-800-M.ttf');
const mg = fm.layout('M').glyphs[0];
const mp = mg.path.scale(1, -1);
const mb = mp.bbox;
const mw = mb.maxX - mb.minX;
const mh = mb.maxY - mb.minY;
const box = 1000;
const scale = (box * 0.62) / mw;
const tx = (box - mw * scale) / 2 - mb.minX * scale;
const ty = (box - mh * scale) / 2 - mb.minY * scale;
const md = mp.scale(scale, scale).translate(tx, ty).toSVG().replace(/-?\d+\.\d+/g, (m) => String(Math.round(parseFloat(m))));
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}"><rect width="${box}" height="${box}" fill="${INK}"/><path d="${md}" fill="${PAPER}"/><rect x="${Math.round(tx + mb.minX * scale)}" y="${Math.round(ty + (mb.minY + mh * 0.44) * scale)}" width="${Math.round(mw * scale)}" height="18" fill="${RED}"/></svg>`;
fs.writeFileSync('public/favicon.svg', favicon);
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(favicon)).resize(512, 512).png().toFile('public/icon-512.png');
console.log('favicon ok');

// ---------- Texto a trazados (instancias estáticas locales de Mona Sans) ----------
const fontCache = {};
async function textPath(text, { wdth = 100, wght = 600, size = 24, tracking = 0 } = {}) {
  const key = `${wdth}-${wght}`;
  fontCache[key] ??= fontkit.openSync(`scripts/fonts/mona-${key}.ttf`);
  const f = fontCache[key];
  const lay = f.layout(text);
  const s = size / f.unitsPerEm;
  let x = 0;
  let out = '';
  for (let i = 0; i < lay.glyphs.length; i++) {
    out += lay.glyphs[i].path.scale(s, -s).translate(x, 0).toSVG();
    x += lay.positions[i].xAdvance * s + tracking;
  }
  return { d: out.replace(/-?\d+\.\d+/g, (m) => String(r1(parseFloat(m)))), width: x - tracking };
}

// ---------- OG images ----------
const media = JSON.parse(fs.readFileSync('src/data/media.json', 'utf8'));
const file = (id) => 'public' + media[id].webp[media[id].webp.length - 1][0];
fs.mkdirSync('public/og', { recursive: true });

function wordmarkSvg(width, top, cutColorTop, cutColorBottom, x = 0) {
  const h = width / wordmark.ratio;
  const cutY = h * wordmark.cutRatio;
  const s = width / wordmark.width;
  return {
    h,
    cutY,
    svg: `<g transform="translate(${x} ${top}) scale(${s})">
      <clipPath id="wt"><rect x="-10" y="-10" width="${wordmark.width + 20}" height="${wordmark.cut + 10}"/></clipPath>
      <clipPath id="wb"><rect x="-10" y="${wordmark.cut}" width="${wordmark.width + 20}" height="${wordmark.height}"/></clipPath>
      <path d="${wordmark.d}" fill="${cutColorTop}" clip-path="url(#wt)"/>
      <path d="${wordmark.d}" fill="${cutColorBottom}" clip-path="url(#wb)"/>
    </g>`,
  };
}

async function ogHome() {
  const OW = 1200, OH = 630, IMG_H = 430;
  const panels = ['tactica-azul-modelo', 'tactica-rojo-modelo', 'tactica-negro-modelo'];
  const comps = [];
  for (let i = 0; i < 3; i++) {
    const buf = await sharp(file(panels[i])).resize({ width: 400, height: IMG_H, fit: 'cover', position: 'top' }).toBuffer();
    comps.push({ input: buf, left: i * 400, top: 0 });
  }
  const wmW = 1000;
  const wm = wordmarkSvg(wmW, 0, PAPER, INK);
  const wmTop = IMG_H - wm.cutY;
  const tag = await textPath('CHAQUETAS Y BUZOS  —  HOMBRE / MUJER  —  TELA PREMIUM', { wdth: 100, wght: 600, size: 19, tracking: 2.2 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}">
    ${wordmarkSvg(wmW, wmTop, PAPER, INK, (OW - wmW) / 2).svg}
    <path transform="translate(${(OW - tag.width) / 2} ${OH - 34})" d="${tag.d}" fill="${INK}"/>
  </svg>`;
  comps.push({ input: Buffer.from(svg), left: 0, top: 0 });
  await sharp({ create: { width: OW, height: OH, channels: 3, background: PAPER } }).composite(comps).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og/og-home.jpg');
  console.log('og-home ok');
}

async function ogProduct(slug, imageId, name) {
  const OW = 1200, OH = 630;
  const meta = media[imageId];
  const comps = [];
  const isStudio = meta.bg === 'studio';
  // Foto completa a la izquierda (sin recortar la prenda), fondo papel.
  const img = await sharp(file(imageId)).resize({ width: 520, height: OH, fit: isStudio ? 'cover' : 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer();
  const tinted = isStudio ? img : await sharp({ create: { width: 520, height: OH, channels: 3, background: PAPER } }).composite([{ input: img, blend: 'multiply' }]).png().toBuffer();
  comps.push({ input: tinted, left: 0, top: 0 });
  const lines = name.toUpperCase().split('|');
  const tps = [];
  for (const l of lines) tps.push(await textPath(l, { wdth: 75, wght: 800, size: 74, tracking: 0 }));
  const cta = await textPath('PEDIDOS POR WHATSAPP', { wdth: 100, wght: 600, size: 18, tracking: 2.4 });
  let y = 250;
  const texts = tps.map((t) => { const s = `<path transform="translate(600 ${y})" d="${t.d}" fill="${INK}"/>`; y += 78; return s; }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}">
    ${wordmarkSvg(250, 64, INK, INK, 600).svg}
    ${texts}
    <rect x="600" y="${OH - 110}" width="540" height="2" fill="${RED}"/>
    <path transform="translate(600 ${OH - 70})" d="${cta.d}" fill="${INK}"/>
  </svg>`;
  comps.push({ input: Buffer.from(svg), left: 0, top: 0 });
  await sharp({ create: { width: OW, height: OH, channels: 3, background: PAPER } }).composite(comps).jpeg({ quality: 86, mozjpeg: true }).toFile(`public/og/og-${slug}.jpg`);
  console.log('og', slug, 'ok');
}

await ogHome();
await ogProduct('hoodie-hombre', 'hoodie-hombre-negro-frente', 'Hoodie|para hombre');
await ogProduct('chaqueta-deportiva-tactica', 'tactica-azul-modelo', 'Chaqueta|deportiva|táctica');
await ogProduct('chaqueton-dama', 'chaqueton-negro-frente', 'Chaquetón|para dama');
await ogProduct('chaqueta-moda-casual', 'casual-rojo-lado', 'Chaqueta|de moda casual');
await ogProduct('buzo-largo-dama', 'buzo-largo-gris-frente', 'Buzo largo|para dama');
