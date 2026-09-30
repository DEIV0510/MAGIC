// Catálogo de MAGIC WORLD: tipos y utilidades sobre src/data/catalog.json
// (la única fuente de datos; la leen también scripts/shopify-export.mjs y
// scripts/brand-assets.mjs). No se inventa nada: lo que no está en catalog.json
// no se muestra (p. ej. la táctica sin precio → "Precio por WhatsApp").
import catalog from './catalog.json';
import media from './media.json';

export type Gender = 'hombre' | 'mujer';
export type Category = 'chaquetas' | 'buzos';
export type MediaId = keyof typeof media;

export interface ProductImage {
  id: MediaId;
  /** Texto para el alt: "puesta", "vista frontal"… */
  view: string;
}

export interface ProductColor {
  id: string;
  /** Código corto para SKU (NEG, BEI…). */
  code: string;
  label: string;
  swatch: string;
  /** Segundo tono (prendas en dos colores). */
  swatch2?: string;
  images: ProductImage[];
}

export interface Product {
  slug: string;
  code: string;
  name: string;
  /** Orden comercial de los prioritarios (1–6). null = resto de la colección. */
  priority: number | null;
  type: 'Buzo' | 'Chaqueta' | 'Chaquetón' | 'Abrigo';
  gender: Gender;
  categories: Category[];
  /** COP, envío incluido. null = sin precio en la info del cliente. */
  price: number | null;
  sizes: string[] | null;
  material: string | null;
  lining?: string | null;
  composition: string | null;
  summary: string;
  description: string;
  details: string[];
  video?: { color: string; label: string };
  colors: ProductColor[];
}

const products = catalog.products as Product[];

// Validación al compilar: cada foto referenciada debe existir en media.json.
for (const p of products) {
  for (const c of p.colors) {
    for (const img of c.images) {
      if (!(img.id in media)) throw new Error(`[catálogo] ${p.slug}/${c.id}: falta la imagen "${img.id}" en media.json (npm run images)`);
    }
  }
}

export { products };

// ---------- Utilidades ----------
export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const priorityProducts = products.filter((p) => p.priority !== null).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
export const secondaryProducts = products.filter((p) => p.priority === null);

export const genderLabel: Record<Gender, string> = { hombre: 'Hombre', mujer: 'Mujer' };

/** "Hombre — Buzo" */
export const productTag = (p: Product) => `${genderLabel[p.gender]} — ${p.type}`;

export const altFor = (p: Product, c: ProductColor, img: ProductImage) => `${p.name} en color ${c.label.toLowerCase()}, ${img.view}`;

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** 79990 → "$79.990" (formato colombiano, sin decimales). */
export const formatPrice = (n: number) => `$${Math.round(n).toLocaleString('es-CO').replace(/,/g, '.')}`;

export const priceLabel = (p: Product) => (p.price ? formatPrice(p.price) : 'Precio por WhatsApp');

/** "S · M · L · XL · XXL" */
export const sizesLabel = (p: Product) => (p.sizes ? p.sizes.join(' · ') : null);

/** CSS del recuadro de color (dos tonos = mitad y mitad). */
export const swatchStyle = (c: ProductColor) =>
  c.swatch2 ? `--sw:linear-gradient(135deg, ${c.swatch} 0 50%, ${c.swatch2} 50% 100%)` : `--sw:${c.swatch}`;

export const minPrice = Math.min(...products.filter((p) => p.price).map((p) => p.price as number));

/** Tela para mostrar: "Algodón perchado Mónaco · 94 % poliéster, 6 % spandex" */
export const fabricLine = (p: Product) => [p.material, p.lining ? `forro en ${p.lining.toLowerCase()}` : null, p.composition].filter(Boolean).join(' · ');

export const productUrl = (p: Product, c?: ProductColor) =>
  !c || c.id === p.colors[0]?.id ? `/producto/${p.slug}/` : `/producto/${p.slug}/?color=${c.id}`;

export interface CollectionDef {
  slug: string;
  path: string;
  title: string;
  heading: string;
  description: string;
  filter: (p: Product) => boolean;
  preview: MediaId;
}

export const collections: CollectionDef[] = [
  {
    slug: 'hombre', path: '/hombre/', title: 'Hombre', heading: 'Hombre',
    description: 'Chaquetas, buzos y abrigos para hombre: hoodie de cordón cruzado, chaqueta UFC, chaqueta de cuatro bolsillos y más. Envío incluido.',
    filter: (p) => p.gender === 'hombre', preview: 'hoodie-negro',
  },
  {
    slug: 'mujer', path: '/mujer/', title: 'Mujer', heading: 'Mujer',
    description: 'Chaquetón, chaqueta Nature Flow, abrigo fleece, buzo en peluche y chaqueta tipo camisa para mujer. Envío incluido.',
    filter: (p) => p.gender === 'mujer', preview: 'nature-flow-lila',
  },
  {
    slug: 'chaquetas', path: '/chaquetas/', title: 'Chaquetas', heading: 'Chaquetas',
    description: 'Chaquetas, chaquetones y abrigos para hombre y mujer, en algodón perchado Mónaco, nailon impermeable y bisonte ovejero. Envío incluido.',
    filter: (p) => p.categories.includes('chaquetas'), preview: 'casual-gris-oscuro-look-2',
  },
  {
    slug: 'buzos', path: '/buzos/', title: 'Buzos', heading: 'Buzos',
    description: 'Hoodies y buzos para hombre y mujer: perchado Mónaco, peluche y tela Zurich con spandex. Envío incluido.',
    filter: (p) => p.categories.includes('buzos'), preview: 'fit-gris',
  },
  {
    slug: 'coleccion', path: '/coleccion/', title: 'Nueva colección', heading: 'Colección 01',
    description: 'La colección completa de MAGIC WORLD: chaquetas, buzos y abrigos para hombre y mujer, con envío incluido.',
    filter: () => true, preview: 'chaqueton-gris-look',
  },
];

/** Colores de la colección (sin repetir nombre), para la paleta de temporada. */
export const collectionPalette = (() => {
  const seen = new Map<string, ProductColor>();
  for (const p of products) for (const c of p.colors) if (!seen.has(c.label)) seen.set(c.label, c);
  return [...seen.values()];
})();
