// Fotos reales de MAGIC WORLD, copiadas SIN modificar a assets/source/
// (nombres originales en assets/source/ORIGEN.md).
//
// bg: 'white'  = estudio con fondo blanco → se funde con el papel (multiply), sin recortar la prenda
//     'studio' = showroom gris con luces → marco completo (cover)
//     'photo'  = foto de ambiente (modelo en exterior/interior) → marco completo (cover)
//     'doc'    = documental (bodega) → escala de grises
// crop  = píxeles a quitar por borde (restos de captura). En 'photo' además se quitan
//         solos los bordes negros de captura de pantalla (autoBorder).
// rect  = recorte explícito {left, top, width, height} (para sacar texto pintado encima).
// focus = object-position cuando la foto se encuadra con cover (por defecto '50% 22%').
export const SOURCE_DIR = 'assets/source';

export const images = [
  // 01 — Hoodie para hombre (cordón cruzado)
  { id: 'hoodie-beige', file: 'hoodie-beige.png', bg: 'photo', focus: '50% 20%' },
  { id: 'hoodie-azul-oscuro', file: 'hoodie-azul-oscuro.png', bg: 'photo', focus: '50% 20%' },
  { id: 'hoodie-negro', file: 'hoodie-negro.png', bg: 'photo', focus: '50% 22%' },

  // 02 — Chaqueta deportiva táctica (showroom)
  { id: 'tactica-azul-modelo', file: 'tactica-azul-modelo.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-azul-frente', file: 'tactica-azul-frente.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-azul-abierta', file: 'tactica-azul-abierta.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-rojo-modelo', file: 'tactica-rojo-modelo.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-rojo-frente', file: 'tactica-rojo-frente.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-rojo-abierta', file: 'tactica-rojo-abierta.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-negro-modelo', file: 'tactica-negro-modelo.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-negro-frente', file: 'tactica-negro-frente.jpg', bg: 'studio', focus: '50% 30%' },
  { id: 'tactica-negro-abierta', file: 'tactica-negro-abierta.jpg', bg: 'studio', focus: '50% 30%' },

  // 03 — Chaqueta UFC combinada para hombre
  { id: 'ufc-negro', file: 'ufc-negro.png', bg: 'photo', focus: '50% 20%' },
  { id: 'ufc-negro-detalle', file: 'ufc-negro-detalle.png', bg: 'photo', focus: '50% 40%' },
  { id: 'ufc-gris-claro', file: 'ufc-gris-claro.png', bg: 'photo', focus: '50% 40%' },
  { id: 'ufc-beige', file: 'ufc-beige.png', bg: 'photo', focus: '50% 40%' },

  // 04 — Chaquetón para dama (cierre diagonal)
  { id: 'chaqueton-negro-estudio', file: 'chaqueton-negro-estudio.jpg', crop: { bottom: 10 }, bg: 'white' },
  { id: 'chaqueton-negro-look', file: 'chaqueton-negro-look.png', bg: 'photo', focus: '50% 20%' },
  { id: 'chaqueton-negro-look-2', file: 'chaqueton-negro-look-2.png', bg: 'photo', focus: '50% 25%' },
  { id: 'chaqueton-negro-estudio-espalda', file: 'chaqueton-negro-estudio-espalda.jpg', crop: { bottom: 6 }, bg: 'white' },
  { id: 'chaqueton-gris-estudio', file: 'chaqueton-gris-estudio.jpg', crop: { top: 28, bottom: 4 }, bg: 'white' },
  { id: 'chaqueton-gris-look', file: 'chaqueton-gris-look.png', bg: 'photo', focus: '50% 25%' },
  { id: 'chaqueton-gris-look-2', file: 'chaqueton-gris-look-2.png', bg: 'photo', focus: '50% 25%' },
  { id: 'chaqueton-gris-estudio-espalda', file: 'chaqueton-gris-estudio-espalda.jpg', crop: { bottom: 2 }, bg: 'white' },

  // 05 — Chaqueta de moda casual para hombre (cuatro bolsillos)
  { id: 'casual-gris-oscuro-estudio', file: 'casual-gris-oscuro-estudio.jpg', crop: { bottom: 3 }, bg: 'white' },
  { id: 'casual-gris-oscuro-look-2', file: 'casual-gris-oscuro-look-2.png', bg: 'photo', focus: '50% 20%' },
  { id: 'casual-gris-oscuro-look', file: 'casual-gris-oscuro-look.png', bg: 'photo', focus: '50% 20%' },
  { id: 'casual-gris-oscuro-producto', file: 'casual-gris-oscuro-producto.png', crop: { top: 1, right: 2 }, bg: 'white' },

  // 06 — Chaqueta Nature Flow
  { id: 'nature-flow-negro', file: 'nature-flow-negro.png', bg: 'photo', focus: '50% 18%' },
  { id: 'nature-flow-lila', file: 'nature-flow-lila.png', bg: 'photo', focus: '50% 22%' },
  { id: 'nature-flow-gris-claro', file: 'nature-flow-gris-claro.png', bg: 'photo', focus: '50% 22%' },
  { id: 'nature-flow-gris-oscuro', file: 'nature-flow-gris-oscuro.png', bg: 'photo', focus: '50% 20%' },

  // Chaqueta combinada para hombre
  { id: 'combinada-negro', file: 'combinada-negro.png', bg: 'photo', focus: '50% 25%' },
  { id: 'combinada-gris-oscuro', file: 'combinada-gris-oscuro.png', bg: 'photo', focus: '50% 30%' },
  { id: 'combinada-azul-oscuro', file: 'combinada-azul-oscuro.png', bg: 'photo', focus: '50% 25%' },
  { id: 'combinada-beige', file: 'combinada-beige.png', bg: 'photo', focus: '50% 30%' },

  // Abrigo fleece para mujer
  { id: 'fleece-lila', file: 'fleece-lila.png', bg: 'photo', focus: '50% 35%' },
  { id: 'fleece-gris-claro', file: 'fleece-gris-claro.png', bg: 'photo', focus: '50% 35%' },
  { id: 'fleece-negro', file: 'fleece-negro.png', bg: 'photo', focus: '50% 35%' },

  // Buzo fit para hombre
  { id: 'fit-gris', file: 'fit-gris.png', bg: 'photo', focus: '50% 25%' },
  { id: 'fit-negro', file: 'fit-negro.png', bg: 'photo', focus: '50% 22%' },
  { id: 'fit-azul', file: 'fit-azul.png', bg: 'photo', focus: '50% 22%' },

  // Buzo en peluche para mujer (la rosa trae texto y botón pintados: se recorta)
  { id: 'peluche-lila', file: 'peluche-lila.png', crop: { bottom: 62 }, bg: 'photo', focus: '50% 30%' },
  { id: 'peluche-rosa', file: 'peluche-rosa.png', rect: { left: 84, top: 128, width: 333, height: 416 }, bg: 'photo', focus: '50% 30%' },

  // Abrigo para hombre
  { id: 'abrigo-hombre-tabaco', file: 'abrigo-hombre-tabaco.png', bg: 'photo', focus: '50% 40%' },

  // Chaqueta tipo camisa para dama
  { id: 'tipo-camisa-camel', file: 'tipo-camisa-camel.png', bg: 'photo', focus: '50% 40%' },
  { id: 'tipo-camisa-camel-espalda', file: 'tipo-camisa-camel-espalda.png', bg: 'photo', focus: '50% 35%' },

  // Bodega (stock real)
  { id: 'bodega-1', file: 'bodega-1.png', bg: 'doc' },
  { id: 'bodega-2', file: 'bodega-2.png', bg: 'doc' },
];

// Anchos a generar (nunca se amplía: los mayores al original se descartan).
export const WIDTHS = [480, 720, 960];
export const DOC_WIDTHS = [360];
