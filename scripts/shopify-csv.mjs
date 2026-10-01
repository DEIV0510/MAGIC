// Formato de importación de productos de Shopify, compartido por shopify-export.mjs
// (catálogo de la web) y shopify-nuevos.mjs (prendas nuevas de la tienda).
// Encabezados copiados de la plantilla oficial product_template.csv (57 columnas).

export const HEADERS = [
  'Title', 'URL handle', 'Description', 'Vendor', 'Product category', 'Type', 'Tags', 'Published on online store', 'Status',
  'SKU', 'Barcode', 'Option1 name', 'Option1 value', 'Option1 Linked To', 'Option2 name', 'Option2 value', 'Option2 Linked To',
  'Option3 name', 'Option3 value', 'Option3 Linked To', 'Price', 'Compare-at price', 'Cost per item', 'Charge tax', 'Tax code',
  'Unit price total measure', 'Unit price total measure unit', 'Unit price base measure', 'Unit price base measure unit',
  'Inventory tracker', 'Inventory quantity', 'Continue selling when out of stock', 'Weight value (grams)', 'Weight unit for display',
  'Requires shipping', 'Fulfillment service', 'Product image URL', 'Image position', 'Image alt text', 'Variant image URL', 'Gift card',
  'SEO title', 'SEO description', 'Color (product.metafields.shopify.color-pattern)', 'Google Shopping / Google product category',
  'Google Shopping / Gender', 'Google Shopping / Age group', 'Google Shopping / Manufacturer part number (MPN)',
  'Google Shopping / Ad group name', 'Google Shopping / Ads labels', 'Google Shopping / Condition', 'Google Shopping / Custom product',
  'Google Shopping / Custom label 0', 'Google Shopping / Custom label 1', 'Google Shopping / Custom label 2',
  'Google Shopping / Custom label 3', 'Google Shopping / Custom label 4',
];

// Categorías verificadas en la taxonomía oficial de Shopify (Shopify/product-taxonomy).
export const CATEGORY = {
  Buzo: 'Apparel & Accessories > Clothing > Clothing Tops > Sweatshirts',
  Hoodie: 'Apparel & Accessories > Clothing > Clothing Tops > Hoodies',
  Chaqueta: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  Chaquetón: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  Abrigo: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
};

export const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const html = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const money = (n) => `$${n.toLocaleString('es-CO').replace(/,/g, '.')}`;
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const trimTo = (s, max) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);

/** Fila vacía con todas las columnas. */
export const blankRow = () => Object.fromEntries(HEADERS.map((h) => [h, '']));

/** Shopify pide UTF-8 (sin BOM) y saltos de línea LF. */
export const toCsv = (rows) => [HEADERS.map(esc).join(','), ...rows.map((r) => HEADERS.map((h) => esc(r[h])).join(','))].join('\n') + '\n';
