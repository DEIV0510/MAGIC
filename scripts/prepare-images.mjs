// Genera las variantes web de las fotos reales de MAGIC.
// - Recorta solo los restos de captura (barras) definidos en images.config.mjs.
// - Nunca amplía: los anchos mayores al original se descartan.
// - AVIF + WebP con nombre por hash (caché inmutable).
// - Escribe src/data/media.json con los anchos MEDIDOS del archivo final.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { images, SOURCE_DIR, WIDTHS, DOC_WIDTHS } from './images.config.mjs';

const OUT_DIR = 'public/img';
const MANIFEST = 'src/data/media.json';
const CONTACT = '.cache/contact-sheet.png';

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync('.cache', { recursive: true });

const hash = (buf) => crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);

async function write(pipeline, id, suffix, ext, opts) {
  const buf = await pipeline.clone()[ext](opts).toBuffer();
  const name = `${id}${suffix}.${hash(buf)}.${ext === 'jpeg' ? 'jpg' : ext}`;
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  const meta = await sharp(buf).metadata();
  return { url: `/img/${name}`, w: meta.width, h: meta.height, bytes: buf.length };
}

async function master(entry) {
  const src = path.join(SOURCE_DIR, entry.file);
  const meta = await sharp(src).metadata();
  const c = { top: 0, bottom: 0, left: 0, right: 0, ...(entry.crop || {}) };
  const width = meta.width - c.left - c.right;
  const height = meta.height - c.top - c.bottom;
  let img = sharp(src).rotate().extract({ left: c.left, top: c.top, width, height }).removeAlpha();
  if (entry.bg === 'doc') img = img.grayscale().normalise({ lower: 2, upper: 99 }).linear(1.06, -6);
  if (entry.bg === 'white') {
    // Mediana del borde (8 px): si el blanco del estudio viene tintado, se neutraliza
    // con una ganancia por canal (corrección de balance, no toca la prenda).
    const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
    const ch = [[], [], []];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (y > 8 && y < info.height - 9 && x > 8 && x < info.width - 9) continue;
        const i = (y * info.width + x) * info.channels;
        const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (l < 235) continue;
        ch[0].push(data[i]);
        ch[1].push(data[i + 1]);
        ch[2].push(data[i + 2]);
      }
    }
    const med = ch.map((a) => (a.sort((p, q) => p - q), a[Math.floor(a.length / 2)] || 255));
    const gain = med.map((m) => Math.min(1.03, 255 / Math.max(m, 240)));
    if (gain.some((g) => g > 1.001)) img = sharp(await img.clone().linear(gain, [0, 0, 0]).png().toBuffer());
    entry._wb = med.join(',');
    // Fondo limpio: casi-blancos (ruido de compresión, sobre todo en los bordes)
    // → blanco puro. Las prendas son oscuras/rojas/azules: no se tocan.
    const raw = await img.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = raw.data;
    for (let i = 0; i < px.length; i += 3) {
      if (px[i] >= 246 && px[i + 1] >= 246 && px[i + 2] >= 246) px[i] = px[i + 1] = px[i + 2] = 255;
    }
    img = sharp(px, { raw: { width: raw.info.width, height: raw.info.height, channels: 3 } });
  }
  // Materializar para que las variantes partan del mismo buffer recortado.
  const buf = await img.png().toBuffer();
  return { buf, width, height };
}

const manifest = {};
const contactTiles = [];
let totalAvif = 0;

for (const entry of images) {
  const { buf, width, height } = await master(entry);
  const base = sharp(buf);
  const wanted = entry.bg === 'doc' ? DOC_WIDTHS : WIDTHS;
  // Anchos: los pedidos que sean menores al original + el original (sin ampliar).
  const targets = [...new Set([...wanted.filter((w) => w < width - 40), width])].sort((a, b) => a - b);

  const avif = [];
  const webp = [];
  for (const w of targets) {
    const resized = w === width
      ? base.clone()
      : base.clone().resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' }).sharpen({ sigma: 0.6 });
    const a = await write(resized, entry.id, `-${w}`, 'avif', { quality: 58, effort: 6 });
    const b = await write(resized, entry.id, `-${w}`, 'webp', { quality: 84, effort: 5 });
    avif.push([a.url, a.w]);
    webp.push([b.url, b.w]);
    totalAvif += a.bytes;
  }

  // Recorte ajustado a la prenda (para la alineación de la colección).
  let trim = null;
  if (entry.bg === 'white') {
    const { data, info } = await sharp(buf).trim({ background: '#ffffff', threshold: 18 }).toBuffer({ resolveWithObject: true });
    const pad = Math.round(Math.max(info.width, info.height) * 0.02);
    const padded = sharp(data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' });
    const pbuf = await padded.png().toBuffer();
    const pm = await sharp(pbuf).metadata();
    const tw = Math.min(480, pm.width);
    const t1 = await write(sharp(pbuf).resize({ width: tw, withoutEnlargement: true }).sharpen({ sigma: 0.5 }), entry.id, `-trim-${tw}`, 'avif', { quality: 60, effort: 6 });
    const t2 = await write(sharp(pbuf).resize({ width: tw, withoutEnlargement: true }).sharpen({ sigma: 0.5 }), entry.id, `-trim-${tw}`, 'webp', { quality: 84, effort: 5 });
    trim = { avif: [[t1.url, t1.w]], webp: [[t2.url, t2.w]], w: t2.w, h: t2.h };
  }

  manifest[entry.id] = {
    bg: entry.bg,
    w: width,
    h: height,
    avif,
    webp,
    fallback: webp[webp.length - 1][0],
    ...(trim ? { trim } : {}),
  };

  contactTiles.push({ buf, width, height, id: entry.id });
  console.log(entry.id.padEnd(28), `${width}x${height}`, targets.join('/'), entry._wb ? `blanco ${entry._wb}` : '');
}

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\n${Object.keys(manifest).length} imágenes · AVIF total ${(totalAvif / 1024).toFixed(0)} KB`);

// Hoja de contacto para revisar recortes a ojo (no se publica).
const TILE_W = 220;
const cols = 6;
const tiles = await Promise.all(contactTiles.map(async (t) => {
  const h = Math.round((t.height / t.width) * TILE_W);
  return { input: await sharp(t.buf).resize({ width: TILE_W }).png().toBuffer(), h, id: t.id };
}));
const rowH = Math.max(...tiles.map((t) => t.h)) + 24;
const rows = Math.ceil(tiles.length / cols);
const composite = [];
tiles.forEach((t, i) => {
  const x = (i % cols) * (TILE_W + 10) + 10;
  const y = Math.floor(i / cols) * rowH + 10;
  composite.push({ input: t.input, left: x, top: y });
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="16"><text x="0" y="12" font-family="Arial" font-size="11" fill="#c00">${t.id}</text></svg>`);
  composite.push({ input: label, left: x, top: y + t.h + 2 });
});
await sharp({ create: { width: cols * (TILE_W + 10) + 10, height: rows * rowH + 20, channels: 3, background: '#9a9a9a' } })
  .composite(composite).png().toFile(CONTACT);
console.log('Hoja de contacto →', CONTACT);
