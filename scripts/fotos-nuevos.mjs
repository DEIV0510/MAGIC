// Fotos listas para subir a Shopify (prendas nuevas y colores nuevos de shopify/nuevos.json):
// shopify/fotos/<prenda>-<color>-<n>.jpg + shopify/fotos/manifest.json (id de origen → archivo).
//
// - Shopify usa el nombre del archivo en su CDN: nombres claros por prenda y color.
// - Varias fotos de estudio del cliente son capturas de otra tienda y traen restos de la
//   interfaz en los bordes (líneas negras arriba, la píldora gris de un botón abajo). Se quitan
//   SOLO esas filas, medidas una por una (2026-10-14), sin ampliar ni retocar. Las demás se
//   copian tal cual (mismos bytes). Los originales de assets/source no se tocan.
// Uso: npm run shopify:fotos
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'assets/source';
const OUT = 'shopify/fotos';

// Filas a quitar por borde (px), medidas con sharp: % de píxeles oscuros por fila desde el borde.
const CROPS = {
  'nuevos-2026-10-13/cruzado-rojo-espalda': { top: 3 }, // fila negra + fila gris
  'nuevos-2026-10-01/abrigo-hebillas-negro-frente': { top: 6, bottom: 3 }, // línea negra + manchas rojas; inicio de la píldora
  'nuevos-2026-10-01/abrigo-hebillas-negro-abierto': { bottom: 6 }, // píldora gris (5 px)
  'nuevos-2026-10-01/abrigo-hebillas-negro-espalda': { top: 2 }, // línea negra
  'nuevos-2026-10-01/chaqueta-cordon-rojo-frente': { top: 4 }, // 3 filas negras
  'nuevos-2026-10-01/chaqueta-cordon-rojo-espalda': { bottom: 4 }, // píldora gris (3 px)
  'nuevos-2026-10-01/chaqueta-cordon-negro-frente': { top: 2, bottom: 2 }, // línea negra; 1 px de píldora
  'nuevos-2026-10-01/chaqueta-cordon-negro-lado': { top: 3, bottom: 11 }, // 2 filas negras; píldora gris (10 px)
  'archivo/casual-negro-estudio': { bottom: 8 }, // línea clara de interfaz a 6-7 px del borde
};

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const { products, cambios } = JSON.parse(fs.readFileSync('shopify/nuevos.json', 'utf8'));
const jobs = [];
for (const p of products.filter((x) => !x.pendiente)) {
  for (const c of p.colors) c.images.forEach(([id], i) => jobs.push({ id, out: `${p.fotos}-${slug(c.label)}-${i + 1}.jpg` }));
}
for (const c of cambios ?? []) {
  if (!c.colorNuevo) continue;
  c.colorNuevo.images.forEach(([id], i) => jobs.push({ id, out: `${c.fotos}-${slug(c.colorNuevo.valor)}-${i + 1}.jpg` }));
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const { id, out } of jobs) {
  const from = path.join(SRC, `${id}.jpg`);
  if (!fs.existsSync(from)) throw new Error(`No existe ${from}`);
  if (Object.values(manifest).includes(out)) throw new Error(`Nombre repetido: ${out}`);
  const crop = CROPS[id];
  if (crop) {
    const { width, height } = await sharp(from).metadata();
    const top = crop.top ?? 0;
    const bottom = crop.bottom ?? 0;
    await sharp(from)
      .extract({ left: 0, top, width, height: height - top - bottom })
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(path.join(OUT, out));
  } else {
    fs.copyFileSync(from, path.join(OUT, out));
  }
  manifest[id] = out;
}
const unused = Object.keys(CROPS).filter((id) => !manifest[id]);
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${OUT}: ${jobs.length} fotos (${jobs.filter((j) => CROPS[j.id]).length} recortadas en los bordes, el resto copiadas tal cual)`);
if (unused.length) console.log(`(recortes sin usar: ${unused.join(', ')})`);
