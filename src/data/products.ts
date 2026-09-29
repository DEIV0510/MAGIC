// Catálogo real de MAGIC.
// - Nombres: brief del cliente (6 prioritarios) + "Buzo largo para dama" (confirmado).
// - Colores y detalles: solo lo que se ve en las fotos de la carpeta MAGIC.
// - price / sizes en null A PROPÓSITO: no hay precios ni tallas en los archivos;
//   la web muestra "Precio por WhatsApp". Cuando el cliente los pase, se cargan aquí.
import media from './media.json';

export type Gender = 'hombre' | 'mujer';
export type Category = 'chaquetas' | 'buzos';

export interface ProductImage {
  id: keyof typeof media;
  view: string; // texto para el alt
}

export interface ProductColor {
  id: string;
  label: string;
  swatch: string;
  images: ProductImage[];
}

export interface Product {
  slug: string;
  /** Orden comercial de los prioritarios (1–6). null = secundario. */
  priority: number | null;
  name: string;
  /** Tipo de prenda para las etiquetas cortas. */
  type: 'Buzo' | 'Chaqueta' | 'Chaquetón';
  gender: Gender | null;
  categories: Category[];
  colors: ProductColor[];
  /** Detalles visibles en las fotos (no se inventan materiales ni medidas). */
  details: string[];
  summary: string;
  price: number | null;
  sizes: string[] | null;
  /** Palabras para la tarjeta tipográfica cuando aún no hay fotos. */
  mark?: string[];
  /** Para conectar Shopify más adelante: id de variante por color. */
  shopifyVariants?: Record<string, string>;
}

const SW = {
  negro: '#161616',
  gris: '#434341',
  azul: '#1F2940',
  rojo: '#A52023',
};

export const products: Product[] = [
  {
    slug: 'hoodie-hombre',
    priority: 1,
    name: 'Hoodie para hombre',
    type: 'Buzo',
    gender: 'hombre',
    categories: ['buzos'],
    colors: [
      { id: 'negro', label: 'Negro', swatch: SW.negro, images: [{ id: 'hoodie-hombre-negro-frente', view: 'vista frontal' }] },
      { id: 'gris-carbon', label: 'Gris carbón', swatch: SW.gris, images: [{ id: 'hoodie-hombre-gris-frente', view: 'vista frontal' }] },
    ],
    details: [
      'Cierre frontal completo',
      'Capucha con cordón',
      'Dos bolsillos de pecho con solapa',
      'Bolsillos frontales',
      'Puños y pretina en rib',
    ],
    summary: 'Cierre completo, capucha con cordón y bolsillos con solapa en el pecho.',
    price: null,
    sizes: null,
  },
  {
    slug: 'chaqueta-deportiva-tactica',
    priority: 2,
    name: 'Chaqueta deportiva táctica',
    type: 'Chaqueta',
    gender: 'hombre',
    categories: ['chaquetas'],
    colors: [
      {
        id: 'azul-marino', label: 'Azul marino', swatch: SW.azul,
        images: [
          { id: 'tactica-azul-modelo', view: 'puesta' },
          { id: 'tactica-azul-frente', view: 'vista frontal' },
          { id: 'tactica-azul-abierta', view: 'abierta, con el forro a la vista' },
        ],
      },
      {
        id: 'rojo', label: 'Rojo', swatch: SW.rojo,
        images: [
          { id: 'tactica-rojo-modelo', view: 'puesta' },
          { id: 'tactica-rojo-frente', view: 'vista frontal' },
          { id: 'tactica-rojo-abierta', view: 'abierta, con el forro a la vista' },
        ],
      },
      {
        id: 'negro', label: 'Negro', swatch: SW.negro,
        images: [
          { id: 'tactica-negro-modelo', view: 'puesta' },
          { id: 'tactica-negro-frente', view: 'vista frontal' },
          { id: 'tactica-negro-abierta', view: 'abierta, con el forro a la vista' },
        ],
      },
    ],
    details: [
      'Cuello alto',
      'Cierre frontal completo',
      'Bolsillo de pecho con cierre',
      'Dos bolsillos laterales con cierre',
      'Franjas de contraste en blanco',
      'Forro interior negro con bolsillo',
    ],
    summary: 'Cuello alto, tres bolsillos con cierre y franjas de contraste.',
    price: null,
    sizes: null,
  },
  {
    slug: 'chaqueta-ufc-combinada',
    priority: 3,
    name: 'Chaqueta UFC combinada',
    mark: ['UFC', 'Combinada'],
    type: 'Chaqueta',
    gender: null,
    categories: ['chaquetas'],
    colors: [],
    details: [],
    summary: 'Te enviamos fotos, colores y precio por WhatsApp.',
    price: null,
    sizes: null,
  },
  {
    slug: 'chaqueton-dama',
    priority: 4,
    name: 'Chaquetón para dama',
    type: 'Chaquetón',
    gender: 'mujer',
    categories: ['chaquetas'],
    colors: [
      {
        id: 'negro', label: 'Negro', swatch: SW.negro,
        images: [
          { id: 'chaqueton-negro-frente', view: 'vista frontal' },
          { id: 'chaqueton-negro-cuello', view: 'con el cuello abierto' },
          { id: 'chaqueton-negro-frente-2', view: 'cerrado, vista frontal' },
          { id: 'chaqueton-negro-espalda', view: 'vista de espalda' },
        ],
      },
    ],
    details: [
      'Capucha amplia',
      'Cierre asimétrico',
      'Pestañas con hebilla metálica en los puños',
      'Silueta entallada',
      'Largo por debajo de la cadera',
    ],
    summary: 'Capucha amplia, cierre asimétrico y hebillas metálicas en los puños.',
    price: null,
    sizes: null,
  },
  {
    slug: 'chaqueta-moda-casual',
    priority: 5,
    name: 'Chaqueta de moda casual',
    type: 'Chaqueta',
    gender: 'mujer',
    categories: ['chaquetas'],
    colors: [
      {
        id: 'rojo', label: 'Rojo', swatch: SW.rojo,
        images: [
          { id: 'casual-rojo-lado', view: 'vista de tres cuartos' },
          { id: 'casual-rojo-espalda', view: 'vista de espalda' },
        ],
      },
      {
        id: 'negro', label: 'Negro', swatch: SW.negro,
        images: [
          { id: 'casual-negro-frente', view: 'vista frontal' },
          { id: 'casual-negro-lado', view: 'vista de tres cuartos' },
        ],
      },
      {
        id: 'azul-marino', label: 'Azul marino', swatch: SW.azul,
        images: [{ id: 'casual-azul-lado', view: 'vista de tres cuartos' }],
      },
    ],
    details: [
      'Capucha con cordón',
      'Cintura ajustable con cordón',
      'Cuello alto',
      'Cierre frontal completo',
      'Bolsillos de parche',
    ],
    summary: 'Capucha con cordón y cintura ajustable.',
    price: null,
    sizes: null,
  },
  {
    slug: 'chaqueta-nature-flow',
    priority: 6,
    name: 'Chaqueta Nature Flow',
    mark: ['Nature', 'Flow'],
    type: 'Chaqueta',
    gender: null,
    categories: ['chaquetas'],
    colors: [],
    details: [],
    summary: 'Te enviamos fotos, colores y precio por WhatsApp.',
    price: null,
    sizes: null,
  },
  {
    slug: 'buzo-largo-dama',
    priority: null,
    name: 'Buzo largo para dama',
    type: 'Buzo',
    gender: 'mujer',
    categories: ['buzos'],
    colors: [
      {
        id: 'gris-carbon', label: 'Gris carbón', swatch: SW.gris,
        images: [
          { id: 'buzo-largo-gris-frente', view: 'vista frontal' },
          { id: 'buzo-largo-gris-espalda', view: 'vista de espalda' },
        ],
      },
      {
        id: 'negro', label: 'Negro', swatch: SW.negro,
        images: [
          { id: 'buzo-largo-negro-frente', view: 'vista frontal' },
          { id: 'buzo-largo-negro-espalda', view: 'vista de espalda' },
        ],
      },
    ],
    details: [
      'Cierre diagonal',
      'Capucha con cordón',
      'Bajo cruzado y curvo',
      'Bolsillos laterales',
      'Puños en rib',
    ],
    summary: 'Cierre diagonal, capucha con cordón y bajo cruzado.',
    price: null,
    sizes: null,
  },
];

// ---------- Utilidades ----------
export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const priorityProducts = products
  .filter((p) => p.priority !== null)
  .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
export const secondaryProducts = products.filter((p) => p.priority === null);
export const hasPhotos = (p: Product) => p.colors.length > 0;

export const genderLabel: Record<Gender, string> = { hombre: 'Hombre', mujer: 'Mujer' };

/** "HOMBRE — BUZO" · "CHAQUETA" (si no hay género confirmado). */
export const productTag = (p: Product) =>
  [p.gender ? genderLabel[p.gender] : null, p.type].filter(Boolean).join(' — ');

export const altFor = (p: Product, c: ProductColor, img: ProductImage) =>
  `${p.name} en color ${c.label.toLowerCase()}, ${img.view}`;

export const pad2 = (n: number) => String(n).padStart(2, '0');

export interface CollectionDef {
  slug: string;
  path: string;
  title: string;
  heading: string;
  description: string;
  filter: (p: Product) => boolean;
  preview: ProductImage['id'];
}

export const collections: CollectionDef[] = [
  {
    slug: 'hombre', path: '/hombre/', title: 'Hombre', heading: 'Hombre',
    description: 'Chaquetas y buzos para hombre en tela premium: hoodie para hombre y chaqueta deportiva táctica.',
    filter: (p) => p.gender === 'hombre', preview: 'tactica-negro-modelo',
  },
  {
    slug: 'mujer', path: '/mujer/', title: 'Mujer', heading: 'Mujer',
    description: 'Chaquetas y buzos para mujer en tela premium: chaquetón para dama, chaqueta de moda casual y buzo largo.',
    filter: (p) => p.gender === 'mujer', preview: 'chaqueton-negro-cuello',
  },
  {
    slug: 'chaquetas', path: '/chaquetas/', title: 'Chaquetas', heading: 'Chaquetas',
    description: 'Chaquetas MAGIC para hombre y mujer: deportiva táctica, UFC combinada, chaquetón para dama, moda casual y Nature Flow.',
    filter: (p) => p.categories.includes('chaquetas'), preview: 'casual-rojo-lado',
  },
  {
    slug: 'buzos', path: '/buzos/', title: 'Buzos', heading: 'Buzos',
    description: 'Buzos MAGIC en tela premium: hoodie para hombre y buzo largo para dama.',
    filter: (p) => p.categories.includes('buzos'), preview: 'hoodie-hombre-gris-frente',
  },
  {
    slug: 'coleccion', path: '/coleccion/', title: 'Nueva colección', heading: 'Colección 01',
    description: 'La colección completa de MAGIC: chaquetas y buzos para hombre y mujer en tela premium.',
    filter: () => true, preview: 'buzo-largo-negro-frente',
  },
];

/** Colores presentes en toda la colección (para la paleta de temporada). */
export const collectionPalette = (() => {
  const seen = new Map<string, { label: string; swatch: string }>();
  for (const p of products) for (const c of p.colors) if (!seen.has(c.id)) seen.set(c.id, { label: c.label, swatch: c.swatch });
  return [...seen.entries()].map(([id, v]) => ({ id, ...v }));
})();
