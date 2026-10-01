// Prendas NUEVAS para la tienda real (worldmagic.store): shopify/nuevos.json → shopify/nuevos.csv
// para Productos → Importar en el admin de Shopify.
//
// - No inventa datos: si una prenda no tiene precio o tallas, no se genera el CSV (lista lo
//   que falta).
// - Fotos: originales del cliente en assets/source/nuevos-2026-10-01, servidas por GitHub
//   (repo público): tienen que estar subidas al repo ANTES de importar.
// - Opciones como en la tienda: COLOR (en mayúsculas, igual que los demás productos) y Talla.
// - Inventario sin seguimiento (siempre disponible) salvo que la prenda traiga "stock".
// Uso: npm run shopify:nuevos
import fs from 'node:fs';
import { CATEGORY, blankRow, cap, html, money, toCsv, trimTo } from './shopify-csv.mjs';

const RAW = 'https://raw.githubusercontent.com/DEIV0510/MAGIC/main/assets/source/nuevos-2026-10-01';
const LOCAL = 'assets/source/nuevos-2026-10-01';
const VENDOR = 'magic world';

const { products } = JSON.parse(fs.readFileSync('shopify/nuevos.json', 'utf8'));

const missing = [];
for (const p of products) {
  const lacks = [!p.price && 'precio', !p.sizes?.length && 'tallas'].filter(Boolean);
  if (lacks.length) missing.push(`${p.name}: falta ${lacks.join(' y ')}`);
  for (const c of p.colors) for (const [id] of c.images) if (!fs.existsSync(`${LOCAL}/${id}.jpg`)) missing.push(`${p.name}: no existe ${LOCAL}/${id}.jpg`);
}
if (missing.length) {
  console.error(`No se genera shopify/nuevos.csv:\n  - ${missing.join('\n  - ')}`);
  process.exit(1);
}

const rows = [];
let variantCount = 0;
let imageCount = 0;
for (const p of products) {
  const body = [
    `<p>${html(p.description)}</p>`,
    `<ul>${p.details.map((d) => `<li>${html(d)}</li>`).join('')}</ul>`,
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
        'SEO description': trimTo(`${p.name} de MAGIC WORLD: ${money(p.price)}, envío gratis y pago contraentrega. ${p.summary} En ${colorsText}.`, 160),
      });
    }
    const v = variants[i];
    if (v) {
      Object.assign(r, {
        'Option1 value': v.c.value,
        'Option2 value': v.z,
        Price: String(p.price),
        'Compare-at price': p.compareAt ? String(p.compareAt) : '',
        'Charge tax': 'TRUE',
        'Inventory tracker': p.stock != null ? 'shopify' : '',
        'Inventory quantity': p.stock != null ? String(p.stock) : '',
        'Continue selling when out of stock': 'DENY',
        'Requires shipping': 'TRUE',
        'Fulfillment service': 'manual',
        'Variant image URL': `${RAW}/${v.c.images[0][0]}.jpg`,
      });
      variantCount++;
    }
    const img = images[i];
    if (img) {
      Object.assign(r, { 'Product image URL': `${RAW}/${img.id}.jpg`, 'Image position': String(i + 1), 'Image alt text': img.alt });
      imageCount++;
    }
    rows.push(r);
  }
}

const csv = toCsv(rows);
fs.writeFileSync('shopify/nuevos.csv', csv, 'utf8');
console.log(`shopify/nuevos.csv → ${products.length} productos, ${variantCount} variantes, ${imageCount} imágenes (${(csv.length / 1024).toFixed(0)} KB)`);
