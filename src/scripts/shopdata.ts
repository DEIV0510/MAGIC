// Catálogo mínimo incrustado en cada página (#shop-data, ver Base.astro):
// lo usan el buscador, la vista rápida y la bolsa (para re-precios).
export interface ShopColor {
  id: string;
  /** Etiqueta: "Azul oscuro" */
  l: string;
  /** Valor CSS del recuadro (color o degradado de dos tonos). */
  sw: string;
  /** Miniatura (≈480 px). */
  i: string;
  /** Fondo de la foto: white | studio | photo. */
  b: string;
  /** true = color principal (su URL no lleva ?color=). */
  d: boolean;
}

export interface ShopItem {
  s: string;
  n: string;
  t: string;
  p: number | null;
  z: string[] | null;
  k: string;
  c: ShopColor[];
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

export const findItem = (slug: string) => shopData().find((i) => i.s === slug);

export const money = (n: number) => `$${Math.round(n).toLocaleString('es-CO').replace(/,/g, '.')}`;

export const itemUrl = (item: ShopItem, color?: ShopColor | null) =>
  !color || color.d ? `/producto/${item.s}/` : `/producto/${item.s}/?color=${color.id}`;
