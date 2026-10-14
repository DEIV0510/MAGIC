// Prendas NUEVAS para la tienda real (worldmagic.store): shopify/nuevos.json → shopify/nuevos.csv
// para Productos → Importar en el admin de Shopify.
//
// - No inventa datos: si una prenda no tiene precio o tallas, no se genera el CSV (lista lo
//   que falta).
// - Fotos: las de shopify/fotos (npm run shopify:fotos: nombres claros y sin restos de captura
//   en los bordes), servidas por GitHub (repo público): tienen que estar subidas al repo ANTES
//   de importar.
// - Prendas con "pendiente" se saltan (p. ej. la que el cliente ya creó a mano en la tienda).
// - Opciones como en la tienda: COLOR (en mayúsculas, igual que los demás productos) y Talla.
// - Sin impuesto (como 11 de los 13 productos de la tienda) e inventario sin seguimiento
//   (siempre disponible) salvo que la prenda traiga "stock".
// - Los cambios a productos que YA existen ("cambios" en nuevos.json) no van por CSV: se hacen
//   en el admin (pisar un producto por CSV puede reemplazar sus fotos).
// Uso: npm run shopify:fotos && npm run shopify:nuevos
import fs from 'node:fs';
import { CATEGORY, blankRow, cap, html, toCsv } from './shopify-csv.mjs';

const RAW = 'https://raw.githubusercontent.com/DEIV0510/MAGIC/main/shopify/fotos';
const FOTOS = 'shopify/fotos';
const VENDOR = 'magic world';

const all = JSON.parse(fs.readFileSync('shopify/nuevos.json', 'utf8')).products;
const products = all.filter((p) => !p.pendiente);
for (const p of all.filter((x) => x.pendiente)) console.log(`(se salta) ${p.name}: ${p.pendiente.split(':')[0]}`);

const manifest = fs.existsSync(`${FOTOS}/manifest.json`) ? JSON.parse(fs.readFileSync(`${FOTOS}/manifest.json`, 'utf8')) : {};
const missing = [];
for (const p of products) {
  const lacks = [!p.price && 'precio', !p.sizes?.length && 'tallas'].filter(Boolean);
  if (lacks.length) missing.push(`${p.name}: falta ${lacks.join(' y ')}`);
  for (const c of p.colors) {
    for (const [id] of c.images) {
      if (!manifest[id] || !fs.existsSync(`${FOTOS}/${manifest[id]}`)) missing.push(`${p.name}: falta la foto lista de ${id} (npm run shopify:fotos)`);
    }
  }
}
if (missing.length) {
  console.error(`No se genera shopify/nuevos.csv:\n  - ${missing.join('\n  - ')}`);
  process.exit(1);
}

/** Frases enteras hasta 160 caracteres (Google corta ahí); nunca a mitad de frase. */
const seo = (parts) => parts.reduce((acc, s) => (`${acc} ${s}`.trim().length <= 160 ? `${acc} ${s}`.trim() : acc), '');
const url = (id) => `${RAW}/${manifest[id]}`;

const rows = [];
let variantCount = 0;
let imageCount = 0;
for (const p of products) {
  const body = [
    `<p>${html(p.description)}</p>`,
    `<ul>${p.details.map((d) => `<li>${html(d)}</li>`).join('')}</ul>`,
    p.material ? `<p><strong>Tela:</strong> ${html(p.material)}.</p>` : '',
    `<p><strong>Tallas:</strong> ${p.sizes.join(', ')}.</p>`,
    '<p>Envío gratis y pago contraentrega.</p>',
  ].join('');
  const colorsText = p.colors.map((c) => c.label.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' y $1');
  const images = p.colors.flatMap((c) => c.images.map(([id, view]) => ({ id, alt: `${p.name} en color ${c.label.toLowerCase()}, ${view}` })));
  const variants = p.colors.flatMap((c) => p.sizes.map((z) => ({ c, z })));
  const n = Math.max(images.length, variants.length);

  for (let i = 0; i < n; i++) {
    const r = blankRow();
    r['URL handle'] = p.handle;
    if (i === 0) {
      Object.assign(r, {
        Title: p.name.toUpperCase(),
        Description: body,
        Vendor: VENDOR,
        'Product category': CATEGORY[p.type] ?? CATEGORY.Chaqueta,
        Type: p.type,
        Tags: [cap(p.gender), ...p.collections].filter((t, k, a) => a.indexOf(t) === k).join(', '),
        'Published on online store': 'TRUE',
        Status: p.status ?? 'active',
        'Option1 name': 'COLOR',
        'Option2 name': 'Talla',
        'Gift card': 'FALSE',
        'SEO title': `${p.name} · MAGIC WORLD`,
        // Sin precio: si cambia, el texto no queda viejo (pasó con la casual).
        'SEO description': seo([`${p.name}.`, p.summary, `En ${colorsText}.`, 'Envío gratis y pago contraentrega.']),
      });
    }
    const v = variants[i];
    if (v) {
      Object.assign(r, {
        'Option1 value': v.c.value,
        'Option2 value': v.z,
        Price: String(p.price),
        'Compare-at price': p.compareAt ? String(p.compareAt) : '',
        'Charge tax': 'FALSE',
        'Inventory tracker': p.stock != null ? 'shopify' : '',
        'Inventory quantity': p.stock != null ? String(p.stock) : '',
        'Continue selling when out of stock': 'DENY',
        'Requires shipping': 'TRUE',
        'Fulfillment service': 'manual',
        'Variant image URL': url(v.c.images[0][0]),
      });
      variantCount++;
    }
    const img = images[i];
    if (img) {
      Object.assign(r, { 'Product image URL': url(img.id), 'Image position': String(i + 1), 'Image alt text': img.alt });
      imageCount++;
    }
    rows.push(r);
  }
}

const csv = toCsv(rows);
fs.writeFileSync('shopify/nuevos.csv', csv, 'utf8');
console.log(`shopify/nuevos.csv → ${products.length} productos, ${variantCount} variantes, ${imageCount} imágenes (${(csv.length / 1024).toFixed(0)} KB)`);
