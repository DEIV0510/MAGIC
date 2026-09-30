// Construye el tema Shopify (shopify-theme/) a partir de la web:
//   - assets/magic.css y magic-home.css  ← src/styles + theme-src/css
//   - assets/magic.js y magic-smooth.js  ← theme-src/js (esbuild)
//   - assets/mona-sans.woff2, favicon, OG, recorte del chaquetón, bodega y video
//   - snippets/mw-map.liquid             ← theme-src/catalog-map.json + fotos reales de la tienda
// Uso: npm run theme            (usa la copia en caché de los productos de la tienda)
//      npm run theme -- --refresh  (vuelve a leer worldmagic.store/products.json)
import fs from 'node:fs';
import path from 'node:path';
import { build, transform } from 'esbuild';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'theme-src');
const OUT = path.join(ROOT, 'shopify-theme');
const ASSETS = path.join(OUT, 'assets');
const STORE = 'https://worldmagic.store';
const refresh = process.argv.includes('--refresh');

fs.mkdirSync(ASSETS, { recursive: true });
fs.mkdirSync(path.join(OUT, 'snippets'), { recursive: true });

const read = (p) => fs.readFileSync(p, 'utf8');
const handleize = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---------------------------------------------------------------------------
// 1. Productos reales de la tienda (para pasar posiciones de foto → nombre de archivo)
// ---------------------------------------------------------------------------
const cacheFile = path.join(SRC, 'store-products.json');
let storeProducts;
if (refresh || !fs.existsSync(cacheFile)) {
  const r = await fetch(`${STORE}/products.json?limit=250`, { headers: { 'User-Agent': 'Mozilla/5.0 magic-theme-build' } });
  if (!r.ok) throw new Error(`No se pudo leer ${STORE}/products.json (${r.status})`);
  storeProducts = (await r.json()).products;
  fs.writeFileSync(cacheFile, JSON.stringify(storeProducts, null, 1));
  console.log(`· ${storeProducts.length} productos leídos de la tienda`);
} else {
  storeProducts = JSON.parse(read(cacheFile));
}
const byHandle = new Map(storeProducts.map((p) => [p.handle, p]));
const basename = (src) => decodeURIComponent(src.split('?')[0].split('/').pop()).replace(/\.[a-z0-9]+$/i, '');

// Fondo de cada foto: blanco puro en el borde → 'white' (se funde con el papel);
// cualquier otra cosa → 'photo' (cubre el marco). Se guarda en caché por archivo.
const bgCacheFile = path.join(SRC, 'media-bg.json');
const bgCache = fs.existsSync(bgCacheFile) ? JSON.parse(read(bgCacheFile)) : {};
async function classify(img) {
  const name = basename(img.src);
  if (bgCache[name]) return bgCache[name];
  const url = img.src + (img.src.includes('?') ? '&' : '?') + 'width=240';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 magic-theme-build' } });
  const buf = Buffer.from(await r.arrayBuffer());
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const ring = 5;
  let n = 0;
  let bright = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= ring && x < w - ring && y >= ring && y < h - ring) continue;
      const i = (y * w + x) * ch;
      n++;
      if (data[i] >= 242 && data[i + 1] >= 242 && data[i + 2] >= 242) bright++;
    }
  }
  // Las fotos de producto en estudio blanco tocan el borde con la prenda: 69-100 % de
  // borde blanco. Las de ambiente o estudio gris quedan por debajo del 20 %.
  const bg = bright / n >= 0.65 ? 'white' : 'photo';
  const aspect = img.width / img.height;
  const entry = { bg, focus: bg === 'white' ? '50% 50%' : aspect < 0.72 ? '50% 28%' : '50% 24%' };
  bgCache[name] = entry;
  return entry;
}

// ---------------------------------------------------------------------------
// 2. snippets/mw-map.liquid
// ---------------------------------------------------------------------------
const map = JSON.parse(read(path.join(SRC, 'catalog-map.json')));
// Fuera los separadores (~ | ^) y las llaves (no deben formar {{ o {% de Liquid).
const esc = (s) => String(s ?? '').replace(/[~|^{}]/g, ' ').trim();
const lines = [];
const partInfo = [];
const partSummary = [];
const partDescription = [];
const partDetails = [];
const partFabric = [];
const partMedia = [];
const partSwatch = [];
const problems = [];

for (const [handle, p] of Object.entries(map.products)) {
  const sp = byHandle.get(handle);
  if (!sp) {
    problems.push(`El producto "${handle}" ya no existe en la tienda`);
    continue;
  }
  const colorOpt = sp.options.find((o) => /^colou?r(es)?$/i.test(o.name.trim()));
  const storeColors = colorOpt ? colorOpt.values : [];
  for (const c of Object.keys(p.colors)) {
    if (colorOpt && !storeColors.includes(c)) problems.push(`${handle}: el color "${c}" no está en la tienda (${storeColors.join(', ')})`);
  }
  const colorKeys = Object.keys(p.colors).map(handleize);
  const fabric = [p.material, p.lining ? `forro en ${p.lining.toLowerCase()}` : null, p.composition].filter(Boolean).join(' · ');
  const tag = `${p.gender === 'mujer' ? 'Mujer' : 'Hombre'} — ${p.type}`;
  // info = nombre~prioridad~género~etiqueta~categorías~video~orden de colores
  partInfo.push([handle, [esc(p.name), p.priority ?? '', p.gender, esc(tag), p.categories.join(','), p.video ? handleize(p.video) : '', colorKeys.join(',')].join('~')]);
  partSummary.push([handle, esc(p.summary)]);
  partDescription.push([handle, esc(p.description)]);
  partDetails.push([handle, p.details.map((d) => `<li>${esc(d)}</li>`).join('')]);
  partFabric.push([handle, esc(fabric)]);
  for (const [value, c] of Object.entries(p.colors)) {
    const key = `${handle}/${handleize(value)}`;
    const sw = c.swatch2 ? `linear-gradient(135deg, ${c.swatch} 0 50%, ${c.swatch2} 50% 100%)` : c.swatch;
    partSwatch.push([key, sw]);
    const imgs = [];
    for (const [pos, view] of c.images) {
      const img = sp.images[pos - 1];
      if (!img) {
        problems.push(`${handle}/${value}: no existe la foto ${pos} (la tienda tiene ${sp.images.length})`);
        continue;
      }
      const meta = await classify(img);
      imgs.push([basename(img.src), meta.bg, meta.focus, esc(view)].join('~'));
    }
    partMedia.push([key, imgs.join('|')]);
  }
}
fs.writeFileSync(bgCacheFile, JSON.stringify(bgCache, null, 1));

const whenBlock = (entries) => entries.map(([k, v]) => `    {%- when '${k}' -%}${v}`).join('\n');
const genericSwatches = Object.entries(map.swatches)
  .map(([k, v]) => `        {%- when '${k}' -%}${v}`)
  .join('\n');

lines.push(`{%- comment -%}
  GENERADO por scripts/build-theme.mjs desde theme-src/catalog-map.json — no editar a mano.
  Parámetros: part ('info' | 'summary' | 'description' | 'details' | 'fabric'),
  handle (producto) o key ('handle/color-en-handle' para media y swatch).
  media  → archivo~fondo~foco~vista|…   (fondo: white = estudio blanco, photo = ambiente)
  info   → nombre~prioridad~género~etiqueta~categorías~color-del-video~orden-de-colores
{%- endcomment -%}
{%- case part -%}
  {%- when 'info' -%}
  {%- case handle -%}
${whenBlock(partInfo)}
  {%- endcase -%}
  {%- when 'summary' -%}
  {%- case handle -%}
${whenBlock(partSummary)}
  {%- endcase -%}
  {%- when 'description' -%}
  {%- case handle -%}
${whenBlock(partDescription)}
  {%- endcase -%}
  {%- when 'details' -%}
  {%- case handle -%}
${whenBlock(partDetails)}
  {%- endcase -%}
  {%- when 'fabric' -%}
  {%- case handle -%}
${whenBlock(partFabric)}
  {%- endcase -%}
{%- endcase -%}
`);
fs.writeFileSync(path.join(OUT, 'snippets', 'mw-map.liquid'), lines.join('\n'));
fs.writeFileSync(
  path.join(OUT, 'snippets', 'mw-media-map.liquid'),
  `{%- comment -%} GENERADO por scripts/build-theme.mjs — fotos por color: archivo~fondo~foco~vista|… (key = handle/color). {%- endcomment -%}
{%- case key -%}
${whenBlock(partMedia)}
{%- endcase -%}
`,
);
fs.writeFileSync(
  path.join(OUT, 'snippets', 'mw-swatch-map.liquid'),
  `{%- comment -%} GENERADO por scripts/build-theme.mjs — color del recuadro (key = handle/color); si no está, por nombre del color. {%- endcomment -%}
{%- case key -%}
${whenBlock(partSwatch)}
  {%- else -%}
    {%- assign mw_c = key | split: '/' | last -%}
    {%- assign mw_first = mw_c | split: '-' | first -%}
    {%- case mw_c -%}
${genericSwatches}
      {%- else -%}
        {%- case mw_first -%}
${genericSwatches}
          {%- else -%}#8f8f93
        {%- endcase -%}
    {%- endcase -%}
{%- endcase -%}
`,
);
if (problems.length) {
  console.log('\n⚠ Revisar catalog-map.json:');
  for (const p of problems) console.log('  - ' + p);
}
console.log(`· snippets/mw-map.liquid (${Object.keys(map.products).length} productos)`);

// ---------------------------------------------------------------------------
// 3. CSS
// ---------------------------------------------------------------------------
const css = (files) => files.map((f) => read(path.join(ROOT, f))).join('\n');
const baseCss = css(['src/styles/tokens.css', 'src/styles/base.css', 'src/styles/chrome.css', 'src/styles/shop.css', 'theme-src/css/shopify.css']);
const homeCss = css(['src/styles/home.css', 'theme-src/css/home-shopify.css']);
for (const [name, source] of [
  ['magic.css', baseCss],
  ['magic-home.css', homeCss],
]) {
  const { code } = await transform(source, { loader: 'css', minify: true, target: ['chrome111', 'safari16.4', 'firefox115'] });
  fs.writeFileSync(path.join(ASSETS, name), code);
  console.log(`· assets/${name} ${(code.length / 1024).toFixed(1)} KB`);
}

// ---------------------------------------------------------------------------
// 4. JS
// ---------------------------------------------------------------------------
for (const [entry, out] of [
  ['theme-src/js/main.ts', 'magic.js'],
  ['theme-src/js/smooth.ts', 'magic-smooth.js'],
]) {
  const res = await build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: 'esm',
    minify: true,
    target: ['es2020'],
    write: false,
    legalComments: 'none',
  });
  const code = res.outputFiles[0].text;
  fs.writeFileSync(path.join(ASSETS, out), code);
  console.log(`· assets/${out} ${(code.length / 1024).toFixed(1)} KB`);
}

// ---------------------------------------------------------------------------
// 5. Fuente, iconos, OG, recorte del chaquetón, bodega y video
// ---------------------------------------------------------------------------
const copy = (from, to) => {
  fs.copyFileSync(path.join(ROOT, from), path.join(ASSETS, to));
};
const fontHref = JSON.parse(read('src/data/font.json')).href; // /fonts/mona-sans.xxxx.woff2
copy(path.join('public', fontHref), 'mona-sans.woff2');
copy('public/favicon.svg', 'mw-favicon.svg');
copy('public/favicon-32.png', 'mw-favicon-32.png');
copy('public/apple-touch-icon.png', 'mw-apple-touch-icon.png');
copy('public/og/og-home.jpg', 'mw-og.jpg');

const media = JSON.parse(read('src/data/media.json'));
const copySet = (id, prefix) => {
  const m = media[id];
  for (const fmt of ['avif', 'webp']) {
    for (const [url, w] of m[fmt]) copy(path.join('public', url), `${prefix}-${w}.${fmt}`);
  }
  return { w: m.w, h: m.h, widths: m.avif.map(([, w]) => w) };
};
const assetsInfo = {
  cut: copySet('chaqueton-negro-estudio-cut', 'mw-cut'),
  bodega1: copySet('bodega-1', 'mw-bodega-1'),
  bodega2: copySet('bodega-2', 'mw-bodega-2'),
};
const video = JSON.parse(read('src/data/video.json'));
copy(path.join('public', video.src), 'mw-fit.mp4');
copy(path.join('public', video.poster), `mw-fit-poster${path.extname(video.poster)}`);
assetsInfo.video = { w: video.w, h: video.h, poster: `mw-fit-poster${path.extname(video.poster)}` };

// Datos de las imágenes propias para el Liquid (anchos reales disponibles).
const W = (a) => a.widths.join(',');
fs.writeFileSync(
  path.join(OUT, 'snippets', 'mw-assets.liquid'),
  `{%- comment -%} GENERADO por scripts/build-theme.mjs — anchos y medidas de las imágenes propias del tema. {%- endcomment -%}
{%- case name -%}
  {%- when 'cut' -%}mw-cut~${W(assetsInfo.cut)}~${assetsInfo.cut.w}~${assetsInfo.cut.h}
  {%- when 'bodega-1' -%}mw-bodega-1~${W(assetsInfo.bodega1)}~${assetsInfo.bodega1.w}~${assetsInfo.bodega1.h}
  {%- when 'bodega-2' -%}mw-bodega-2~${W(assetsInfo.bodega2)}~${assetsInfo.bodega2.w}~${assetsInfo.bodega2.h}
  {%- when 'video' -%}mw-fit.mp4~${assetsInfo.video.poster}~${assetsInfo.video.w}~${assetsInfo.video.h}
{%- endcase -%}
`,
);

// Logotipo: trazados del wordmark para el sprite SVG.
const wm = JSON.parse(read('src/data/wordmark.json'));
fs.writeFileSync(
  path.join(OUT, 'snippets', 'mw-wordmark-sprite.liquid'),
  `{%- comment -%} GENERADO por scripts/build-theme.mjs — trazados de Mona Sans Expanded 800. {%- endcomment -%}
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="wm-line" viewBox="${wm.line.viewBox}"><path d="${wm.line.d}"></path></symbol>
  <symbol id="wm-stack" viewBox="${wm.stack.viewBox}"><path d="${wm.stack.d}"></path></symbol>
</svg>
`,
);
fs.writeFileSync(
  path.join(OUT, 'snippets', 'mw-wordmark-data.liquid'),
  `{%- comment -%} GENERADO — medidas del logotipo (ancho~alto~corte). {%- endcomment -%}
{%- case wl -%}
  {%- when 'stack' -%}${wm.stack.width}~${wm.stack.height}~${wm.stack.cut}~${wm.stack.cutRatio}~${(wm.stack.cut / wm.stack.width).toFixed(5)}
  {%- else -%}${wm.line.width}~${wm.line.height}~${wm.line.cut}~${wm.line.cutRatio}~${(wm.line.cut / wm.line.width).toFixed(5)}
{%- endcase -%}
`,
);

console.log('· fuente, iconos, OG, recorte, bodega y video copiados');
console.log('✔ Tema listo en shopify-theme/');
