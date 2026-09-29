// Recorte con alfa del chaquetón (solo para el producto destacado, donde la
// prenda pasa por delante de la palabra roja). No se pinta ni se deforma nada:
// el fondo blanco del estudio pasa a transparente y el borde se suaviza.
//  1) Relleno desde los bordes por píxeles claros (fondo y sombra suave).
//  2) Esa zona: "color a alfa" contra blanco (la sombra queda como sombra).
//  3) El borde de 1 px de la prenda: mismo cálculo para no dejar halo claro.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { images, SOURCE_DIR } from './images.config.mjs';

const ID = 'chaqueton-negro-frente';
const OUT_ID = `${ID}-cut`;
const entry = images.find((e) => e.id === ID);
const c = { top: 0, bottom: 0, left: 0, right: 0, ...(entry.crop || {}) };
const src = path.join(SOURCE_DIR, entry.file);
const meta = await sharp(src).metadata();
const W = meta.width - c.left - c.right;
const H = meta.height - c.top - c.bottom;
const { data } = await sharp(src).extract({ left: c.left, top: c.top, width: W, height: H }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

const lum = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) lum[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];

// 1) Relleno por inundación desde el borde a través de píxeles claros.
const LIGHT = 200;
const region = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = y * W + x;
  if (region[i] || lum[i] < LIGHT) return;
  region[i] = 1;
  stack.push(i);
};
for (let x = 0; x < W; x++) {
  push(x, 0);
  push(x, H - 1);
}
for (let y = 0; y < H; y++) {
  push(0, y);
  push(W - 1, y);
}
while (stack.length) {
  const i = stack.pop();
  const x = i % W;
  const y = (i - x) / W;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

// Banda de 2 px de la prenda pegada a esa zona (borde antialias del original).
const band = new Uint8Array(W * H);
for (let pass = 0; pass < 2; pass++) {
  const prev = band.slice();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (region[i] || prev[i]) continue;
      const near = (k) => region[k] || prev[k];
      if ((x > 0 && near(i - 1)) || (x < W - 1 && near(i + 1)) || (y > 0 && near(i - W)) || (y < H - 1 && near(i + W))) band[i] = 1;
    }
  }
}

// 2–3) Color a alfa contra blanco en zona + banda; el resto, opaco.
const INK = 22; // negro de la tela medido en la foto
const out = Buffer.alloc(W * H * 4);
let transparent = 0;
for (let i = 0; i < W * H; i++) {
  const r = data[i * 3];
  const g = data[i * 3 + 1];
  const b = data[i * 3 + 2];
  let a = 255;
  let R = r;
  let G = g;
  let B = b;
  if (region[i] || band[i]) {
    const af = Math.min(1, Math.max(0, (255 - lum[i]) / (255 - INK)));
    a = Math.round(af * 255);
    if (af > 0.001) {
      // des-premultiplicar contra blanco
      R = Math.min(255, Math.max(0, Math.round((r - 255 * (1 - af)) / af)));
      G = Math.min(255, Math.max(0, Math.round((g - 255 * (1 - af)) / af)));
      B = Math.min(255, Math.max(0, Math.round((b - 255 * (1 - af)) / af)));
    }
    if (a < 4) {
      a = 0;
      transparent++;
    }
  }
  out[i * 4] = R;
  out[i * 4 + 1] = G;
  out[i * 4 + 2] = B;
  out[i * 4 + 3] = a;
}
console.log(`${OUT_ID}: ${W}x${H}, transparente ${((transparent / (W * H)) * 100).toFixed(1)} %`);

const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync('.cache/cutout-check.png', png);

// Variantes web con alfa + registro en media.json
const OUT_DIR = 'public/img';
const hash = (buf) => crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);
const manifestPath = 'src/data/media.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const f of fs.readdirSync(OUT_DIR)) if (f.startsWith(`${OUT_ID}-`)) fs.rmSync(path.join(OUT_DIR, f));
const avif = [];
const webp = [];
for (const w of [480, 720, W]) {
  const pipe = w === W ? sharp(png) : sharp(png).resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' });
  for (const [ext, opts, list] of [
    ['avif', { quality: 62, effort: 6 }, avif],
    ['webp', { quality: 86, effort: 5, alphaQuality: 90 }, webp],
  ]) {
    const buf = await pipe.clone()[ext](opts).toBuffer();
    const name = `${OUT_ID}-${w}.${hash(buf)}.${ext}`;
    fs.writeFileSync(path.join(OUT_DIR, name), buf);
    const m = await sharp(buf).metadata();
    list.push([`/img/${name}`, m.width]);
  }
}
manifest[OUT_ID] = { bg: 'cutout', w: W, h: H, avif, webp, fallback: webp[webp.length - 1][0] };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Prueba visual: sobre rojo, para ver halos.
await sharp({ create: { width: W, height: H, channels: 3, background: '#b0161f' } })
  .composite([{ input: png }])
  .png()
  .toBuffer()
  .then((b) => sharp(b).resize({ width: 540 }).png().toFile('.cache/cutout-on-red.png'));
console.log('ok → .cache/cutout-on-red.png');
