// Catálogo mínimo incrustado en cada página (#shop-data, ver snippets/mw-shop-data.liquid):
// lo usan el buscador, la vista rápida y la bolsa. Precios en centavos (API de Shopify).
export interface ShopColor {
  /** Valor tal cual en Shopify: "AZUL OSCURO" */
  v: string;
  /** Etiqueta: "Azul oscuro" */
  l: string;
  /** Valor CSS del recuadro (color o degradado de dos tonos). */
  sw: string;
  /** Miniatura (≈480 px). */
  i: string;
  /** Fondo de la foto: white | photo. */
  b: string;
}

/** [id, opción1, opción2, opción3, disponible (1/0), precio, precio antes] */
export type ShopVariant = [number, string | null, string | null, string | null, number, number, number];

export interface ShopItem {
  h: string;
  u: string;
  n: string;
  t: string;
  p: number;
  cp: number;
  a: number;
  /** Posición (0-2) de la opción de color / talla; -1 si no existe. */
  ci: number;
  zi: number;
  z: string[];
  c: ShopColor[];
  v: ShopVariant[];
  k: string;
}

let cache: ShopItem[] | null = null;

export function shopData(): ShopItem[] {
  if (!cache) {
    try {
      cache = JSON.parse(document.getElementById('shop-data')?.textContent || '[]') as ShopItem[];
    } catch {
      cache = [];
    }
  }
  return cache;
}

export const findItem = (handle: string) => shopData().find((i) => i.h === handle);

export const opt = (v: ShopVariant, index: number) => (index < 0 ? null : (v[index + 1] as string | null));

/** Variante para un color y una talla (talla null = la primera disponible de ese color). */
export function findVariant(item: ShopItem, color: string | null, size: string | null) {
  const match = item.v.filter((v) => (item.ci < 0 || opt(v, item.ci) === color) && (item.zi < 0 || size === null || opt(v, item.zi) === size));
  return match.find((v) => v[4]) ?? match[0] ?? null;
}

/** ¿Hay alguna talla disponible en este color? */
export const colorAvailable = (item: ShopItem, color: string) => item.v.some((v) => (item.ci < 0 || opt(v, item.ci) === color) && v[4]);

export const itemUrl = (item: ShopItem, color?: ShopColor | null) => {
  if (!color || item.ci < 0) return item.u;
  const v = findVariant(item, color.v, null);
  return v ? `${item.u}?variant=${v[0]}` : item.u;
};
