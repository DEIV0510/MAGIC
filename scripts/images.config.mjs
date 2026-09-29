// Fotos reales de la carpeta MAGIC, copiadas SIN modificar a assets/source/
// (el nombre original de WhatsApp está en assets/source/ORIGEN.md).
// crop = píxeles a recortar por borde (restos de capturas de WhatsApp: barras negras/grises).
// bg: 'white' = fondo blanco de estudio (se funde con el papel vía multiply)
//     'studio' = showroom gris con luces (se muestra enmarcada, sin fundir)
//     'doc' = foto documental (bodega), se entrega en escala de grises
export const SOURCE_DIR = 'assets/source';

export const images = [
  // 01 — Hoodie para hombre
  { id: 'hoodie-hombre-negro-frente', file: 'hoodie-hombre-negro-frente.jpg', crop: { bottom: 10 }, bg: 'white' },
  { id: 'hoodie-hombre-gris-frente', file: 'hoodie-hombre-gris-frente.jpg', crop: { bottom: 3 }, bg: 'white' },

  // 02 — Chaqueta deportiva táctica (showroom)
  { id: 'tactica-azul-modelo', file: 'tactica-azul-modelo.jpg', bg: 'studio' },
  { id: 'tactica-azul-frente', file: 'tactica-azul-frente.jpg', bg: 'studio' },
  { id: 'tactica-azul-abierta', file: 'tactica-azul-abierta.jpg', bg: 'studio' },
  { id: 'tactica-rojo-modelo', file: 'tactica-rojo-modelo.jpg', bg: 'studio' },
  { id: 'tactica-rojo-frente', file: 'tactica-rojo-frente.jpg', bg: 'studio' },
  { id: 'tactica-rojo-abierta', file: 'tactica-rojo-abierta.jpg', bg: 'studio' },
  { id: 'tactica-negro-modelo', file: 'tactica-negro-modelo.jpg', bg: 'studio' },
  { id: 'tactica-negro-frente', file: 'tactica-negro-frente.jpg', bg: 'studio' },
  { id: 'tactica-negro-abierta', file: 'tactica-negro-abierta.jpg', bg: 'studio' },

  // 04 — Chaquetón para dama
  { id: 'chaqueton-negro-frente', file: 'chaqueton-negro-frente.jpg', bg: 'white' },
  { id: 'chaqueton-negro-frente-2', file: 'chaqueton-negro-frente-2.jpg', crop: { top: 10, bottom: 4 }, bg: 'white' },
  { id: 'chaqueton-negro-cuello', file: 'chaqueton-negro-cuello.jpg', crop: { bottom: 12 }, bg: 'white' },
  { id: 'chaqueton-negro-espalda', file: 'chaqueton-negro-espalda.jpg', crop: { top: 10 }, bg: 'white' },

  // 05 — Chaqueta de moda casual
  { id: 'casual-negro-frente', file: 'casual-negro-frente.jpg', crop: { top: 10, bottom: 4 }, bg: 'white' },
  { id: 'casual-negro-lado', file: 'casual-negro-lado.jpg', crop: { top: 6, bottom: 16 }, bg: 'white' },
  { id: 'casual-rojo-lado', file: 'casual-rojo-lado.jpg', crop: { top: 6 }, bg: 'white' },
  { id: 'casual-rojo-espalda', file: 'casual-rojo-espalda.jpg', crop: { bottom: 8 }, bg: 'white' },
  { id: 'casual-azul-lado', file: 'casual-azul-lado.jpg', bg: 'white' },

  // Secundario — Buzo largo para dama
  { id: 'buzo-largo-gris-frente', file: 'buzo-largo-gris-frente.jpg', crop: { top: 28, bottom: 4 }, bg: 'white' },
  { id: 'buzo-largo-gris-espalda', file: 'buzo-largo-gris-espalda.jpg', crop: { bottom: 2 }, bg: 'white' },
  { id: 'buzo-largo-negro-frente', file: 'buzo-largo-negro-frente.jpg', crop: { bottom: 10 }, bg: 'white' },
  { id: 'buzo-largo-negro-espalda', file: 'buzo-largo-negro-espalda.jpg', crop: { bottom: 6 }, bg: 'white' },

  // Bodega (stock real)
  { id: 'bodega-1', file: 'bodega-1.png', bg: 'doc' },
  { id: 'bodega-2', file: 'bodega-2.png', bg: 'doc' },
];

// Anchos a generar (nunca se amplía: sharp withoutEnlargement + filtro previo).
export const WIDTHS = [480, 720, 960];
export const DOC_WIDTHS = [360];
