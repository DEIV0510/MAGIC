import media from '@/data/media.json';

export type MediaId = keyof typeof media;
type Entry = (typeof media)[MediaId];
type Set = [string, number][];

export const getMedia = (id: MediaId): Entry => media[id];

const toSrcset = (set: Set) => set.map(([url, w]) => `${url} ${w}w`).join(', ');

/** Datos listos para <picture>: anchos medidos del archivo real (no los pedidos). */
export function pictureData(id: MediaId, variant: 'full' | 'trim' = 'full') {
  const m = media[id] as Entry & { trim?: { avif: Set; webp: Set; w: number; h: number } };
  if (variant === 'trim' && m.trim) {
    return {
      avif: toSrcset(m.trim.avif),
      webp: toSrcset(m.trim.webp),
      src: m.trim.webp[m.trim.webp.length - 1][0],
      width: m.trim.w,
      height: m.trim.h,
      bg: m.bg,
    };
  }
  return {
    avif: toSrcset(m.avif as Set),
    webp: toSrcset(m.webp as Set),
    src: m.fallback,
    width: m.w,
    height: m.h,
    bg: m.bg,
  };
}

/** URL pequeña (≈480 px) para miniaturas: bolsa, buscador, vista previa. */
export function thumbUrl(id: MediaId) {
  const m = media[id];
  return (m.webp as Set)[0][0];
}
