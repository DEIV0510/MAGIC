// Exporta el catálogo a shopify/productos.csv con el formato ACTUAL de importación
// de Shopify (encabezados copiados de su plantilla oficial product_template.csv, 57
// columnas). Lee src/data/catalog.json, la misma fuente que la web.
//
// - Opciones: Color (Option1) y Talla (Option2). El handle = slug de la web, así el
//   checkout de src/commerce/shopify.ts encuentra cada variante sin copiar ids.
// - Imágenes: JPG a resolución completa servidos por la web publicada
//   (SITE_URL/shopify/<id>.jpg). Shopify los descarga al importar: la web con esas
//   fotos tiene que estar publicada ANTES de importar.
// - Inventario sin seguimiento (siempre disponible) hasta que el cliente cargue stock.
// - Prendas sin precio o sin tallas NO se exportan (se listan como pendientes).
// Uso: npm run shopify
import fs from 'node:fs';
import { CATEGORY, blankRow, cap, html, money, toCsv, trimTo } from './shopify-csv.mjs';

const SITE = (process.env.SITE_URL || 'https://magic-tienda.vercel.app').replace(/\/$/, '');
const VENDOR = 'MAGIC WORLD';
const OUT_DIR = 'shopify';

const { products } = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
const media = JSON.parse(fs.readFileSync('src/data/media.json', 'utf8'));

const rows = [];
const skipped = [];
let variantCount = 0;
let imageCount = 0;
const imageIds = new Set();

for (const p of products) {
  if (!p.price || !p.sizes?.length) {
    skipped.push(`${p.name} (${!p.price ? 'sin precio' : ''}${!p.price && !p.sizes ? ' ni ' : ''}${!p.sizes ? 'tallas' : ''})`);
    continue;
  }
  const fabric = [p.material, p.lining ? `forro en ${p.lining.toLowerCase()}` : null, p.composition].filter(Boolean).join(' · ');
  const body = [
    `<p>${html(p.description)}</p>`,
    `<ul>${p.details.map((d) => `<li>${html(d)}</li>`).join('')}</ul>`,
    fabric ? `<p><strong>Tela:</strong> ${html(fabric)}.</p>` : '',
    `<p><strong>Tallas:</strong> ${p.sizes.join(', ')}.</p>`,
    '<p>Precio con envío incluido.</p>',
  ].join('');
  const colorsText = p.colors.map((c) => c.label.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' y $1');
  // Etiquetas = base de las colecciones automáticas (Hombre, Mujer, Chaquetas, Buzos, Destacado).
  const tags = [cap(p.gender), ...p.categories.map(cap), p.material, 'Envío incluido', ...(p.priority ? ['Destacado'] : [])].filter(Boolean);
  const categoryKey = /hoodie/i.test(p.name) ? 'Hoodie' : p.type;

  // Imágenes: todas las de todos los colores, en orden, sin repetir.
  const images = [];
  for (const c of p.colors) {
    for (const img of c.images) {
      if (!media[img.id]) throw new Error(`Falta la imagen ${img.id} en media.json`);
      if (images.some((x) => x.id === img.id)) continue;
      images.push({ id: img.id, alt: `${p.name} en color ${c.label.toLowerCase()}, ${img.view}` });
    }
  }
  const variants = p.colors.flatMap((c) => p.sizes.map((z) => ({ c, z })));
  const n = Math.max(images.length, variants.length);

  for (let i = 0; i < n; i++) {
    const r = blankRow();
    r['URL handle'] = p.slug;
    if (i === 0) {
      Object.assign(r, {
        Title: p.name,
        Description: body,
        Vendor: VENDOR,
        'Product category': CATEGORY[categoryKey] ?? CATEGORY.Chaqueta,
        Type: p.type,
        Tags: tags.join(', '),
        'Published on online store': 'TRUE',
        Status: 'active',
        'Option1 name': 'Color',
        'Option2 name': 'Talla',
        'Gift card': 'FALSE',
        'SEO title': `${p.name} · ${VENDOR}`,
        'SEO description': trimTo(`${p.name} de ${VENDOR}: ${money(p.price)} con envío incluido. ${p.summary} En ${colorsText}.`, 160),
      });
    }
    const v = variants[i];
    if (v) {
      Object.assign(r, {
        SKU: `MW-${p.code}-${v.c.code}-${v.z}`,
        'Option1 value': v.c.label,
        'Option2 value': v.z,
        Price: String(p.price),
        'Charge tax': 'TRUE',
        'Inventory tracker': '',
        'Continue selling when out of stock': 'DENY',
        'Requires shipping': 'TRUE',
        'Fulfillment service': 'manual',
        'Variant image URL': `${SITE}/shopify/${v.c.images[0].id}.jpg`,
      });
      variantCount++;
    }
    const img = images[i];
    if (img) {
      Object.assign(r, {
        'Product image URL': `${SITE}/shopify/${img.id}.jpg`,
        'Image position': String(i + 1),
        'Image alt text': img.alt,
      });
      imageIds.add(img.id);
      imageCount++;
    }
    rows.push(r);
  }
}

const csv = toCsv(rows);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(`${OUT_DIR}/productos.csv`, csv, 'utf8');

// Verificación: cada imagen referenciada existe como JPG en public/shopify/.
const missing = [...imageIds].filter((id) => !fs.existsSync(`public/shopify/${id}.jpg`));
if (missing.length) throw new Error(`Faltan JPG en public/shopify/: ${missing.join(', ')} (npm run images)`);

const exported = products.length - skipped.length;
console.log(`${OUT_DIR}/productos.csv → ${exported} productos, ${variantCount} variantes, ${imageCount} imágenes (${(csv.length / 1024).toFixed(0)} KB)`);
if (skipped.length) console.log(`Pendientes (no exportados): ${skipped.join('; ')}`);
