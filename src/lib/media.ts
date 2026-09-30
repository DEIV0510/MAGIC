import media from '@/data/media.json';

export type MediaId = keyof typeof media;
type Set = [string, number][];
interface Entry {
  bg: 'white' | 'studio' | 'photo' | 'doc' | 'cutout';
  w: number;
  h: number;
  focus?: string;
  avif: Set;
  webp: Set;
  fallback: string;
}

export const getMedia = (id: MediaId) => media[id] as Entry;

/** Fotos de estudio con fondo blanco: se funden con el papel y se muestran enteras. */
export const isOnWhite = (id: MediaId) => getMedia(id).bg === 'white';

const toSrcset = (set: Set) => set.map(([url, w]) => `${url} ${w}w`).join(', ');

/** Datos listos para <picture>: anchos medidos del archivo real (no los pedidos). */
export function pictureData(id: MediaId) {
  const m = getMedia(id);
  return {
    avif: toSrcset(m.avif),
    webp: toSrcset(m.webp),
    src: m.fallback,
    width: m.w,
    height: m.h,
    bg: m.bg,
    focus: m.focus ?? '50% 22%',
  };
}

/** URL pequeña (≈480 px) para miniaturas: bolsa, buscador, vista rápida. */
export const thumbUrl = (id: MediaId) => getMedia(id).webp[0][0];

/** JPG a resolución completa con nombre estable (lo importa Shopify). */
export const shopifyImagePath = (id: MediaId) => `/shopify/${id}.jpg`;
