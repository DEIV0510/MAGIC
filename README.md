# MAGIC WORLD — tienda online

Chaquetas, buzos y abrigos para hombre y mujer. Sitio estático (Astro 7) con bolsa de
compra (color + talla), total con envío incluido y pedido por WhatsApp (323 898 7323).

- Web (Astro): https://magic-tienda.vercel.app
- Tienda real (Shopify): https://worldmagic.store — el mismo diseño hecho tema de
  Shopify en [`shopify-theme/`](shopify-theme); ver [Tema de Shopify](#tema-de-shopify).

## Uso

```bash
npm install
npm run dev        # http://localhost:5441
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:5442
npm run check      # tipos + build + enlaces rotos
```

| Comando | Qué hace |
|---|---|
| `npm run images` | Fotos web (AVIF/WebP, sin ampliar) + JPG para Shopify + recorte del chaquetón + video |
| `npm run brand` | Logotipo MAGIC WORLD, favicon e imágenes para compartir (una por prenda) |
| `npm run shopify` | Genera `shopify/productos.csv` desde el catálogo |
| `npm run font` | Recorta la tipografía (Mona Sans) |

## Dónde se cambia cada cosa

| Qué | Archivo |
|---|---|
| **Productos: nombre, precio, tallas, colores, telas, fotos** | `src/data/catalog.json` (la web y el CSV de Shopify salen de aquí) |
| WhatsApp, redes sociales | `src/data/site.ts` (las redes en `null` no se muestran) |
| Textos de los mensajes de WhatsApp | `src/lib/whatsapp.ts` |
| Fotos nuevas | copiar a `assets/source/`, registrarlas en `scripts/images.config.mjs`, `npm run images` |
| Colores de marca y tipografía | `src/styles/tokens.css` |

Si una foto referenciada en `catalog.json` no existe, **el build falla** con el nombre
de la foto (así no se publica una imagen rota).

## Compra

- «Comprar» abre una vista rápida para elegir color y **talla** (obligatoria); la bolsa
  muestra el precio por línea y el total con envío incluido.
- La bolsa se guarda en el navegador y, al cargar, se re-precia con el catálogo actual.
- **Finalizar pedido** abre WhatsApp con prendas, colores, tallas, cantidades y total.
- `src/commerce/` separa la interfaz del proveedor: `whatsapp.ts` (activo) y
  `shopify.ts` (preparado: busca cada variante por handle + Color + Talla; se activa con
  `PUBLIC_SHOPIFY_DOMAIN` y `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`; no probado contra una
  tienda real porque aún no existe).

## Tema de Shopify

La tienda `c0a6fe-5e.myshopify.com` (worldmagic.store) usa el tema **MAGIC WORLD**
(id `162941861993`, **publicado el 2026-10-01**): la misma portada, animaciones, bolsa,
vista rápida y ficha de la web, pero con los productos, precios, tallas, stock y fotos
**de Shopify**. El tema anterior (Horizon, id `162389983337`) quedó guardado en
Tienda online → Temas y se puede volver a publicar con un clic.

Al subir cambios con `theme push` al tema publicado, se ven en la tienda al instante:
probar antes en un borrador (`theme push --unpublished`) si el cambio es grande.

```bash
npm run theme          # genera shopify-theme/ (CSS, JS y mapas de contenido)
npm run theme -- --refresh   # igual, pero vuelve a descargar los productos de la tienda
npm run theme:check    # revisión de Shopify (debe dar 0 problemas)
npx @shopify/cli theme dev  --store c0a6fe-5e.myshopify.com --path shopify-theme   # vista local
npx @shopify/cli theme push --store c0a6fe-5e.myshopify.com --path shopify-theme --theme 162941861993
```

| Qué | Dónde |
|---|---|
| Precio, precio anterior, tallas, colores, stock, fotos | Admin de Shopify → Productos (el tema los lee) |
| Nombre y textos que muestra el diseño, orden, colores de cada muestra, qué fotos van con cada color | `theme-src/catalog-map.json` (clave = handle del producto en Shopify) + `npm run theme` + push |
| Textos, fotos y productos de cada sección de la portada, menú y pie | Admin → Tienda online → Temas → MAGIC WORLD → **Personalizar** |
| WhatsApp, textos de compra, precio anterior sí/no | Personalizar → Configuración del tema |
| Estilos y animaciones | `src/styles/` (compartidos con la web) + `theme-src/css/` |
| Interacción | `theme-src/js/` (se empaqueta en `assets/magic.js`) |

- Un producto nuevo que no esté en `catalog-map.json` se muestra igual, con el título y
  la descripción que tenga en Shopify.
- **Pago contraentrega (Releasit)**: la ficha pone el enlace `/rsi-btn-overwrite` y
  Releasit lo convierte en su botón con la variante elegida (color + talla); sin talla
  el tema no deja abrir el formulario. En `/cart` va el botón de Releasit del carrito.
  El botón flotante de Releasit se oculta y el suyo toma el estilo de la web.
- Colecciones creadas para el menú: `hombre`, `mujer`, `chaquetas`, `buzos`.
- `shopify-live/` (no va al repo) es la copia del tema Horizon que estaba publicado.

## Pendiente del cliente

- **Chaqueta deportiva táctica**: precio y tallas (hoy «Precio por WhatsApp»).
- Redes sociales (Instagram, TikTok…).
- Condiciones de pago y cambios, si se quieren publicar.
- Dominio propio (si lo compran): cambiarlo en `astro.config.mjs`.
- Ocultas por falta de datos (fotos en `assets/source/archivo/`): el abrigo negro con
  hebillas y la chaqueta de dama con cordón en la cintura.

## Estructura

```
assets/source/     fotos originales (copias exactas) + video + ORIGEN.md
assets/source/archivo/  prendas ocultas y colores que no se venden
scripts/           imágenes, recorte, video, marca, CSV de Shopify y QA
shopify/           productos.csv + GUIA.md (ya no importar: la tienda tiene sus productos)
shopify-theme/     tema de Shopify listo para subir (generado en parte por npm run theme)
theme-src/         fuentes del tema: mapa de contenido, CSS y JS propios de Shopify
src/data/          catalog.json, marca, logotipo, manifiestos de imagen y video
src/components/    piezas de la interfaz (home/ = secciones de la portada)
src/commerce/      bolsa y proveedores de checkout
src/scripts/       interacción (home y ficha se cargan aparte)
src/styles/        tokens, base, chrome (header/diálogos/footer), home y tienda
public/shopify/    JPG estables que Shopify descarga al importar
```

Tipografía: Mona Sans (SIL OFL 1.1, © GitHub), licencia en `scripts/fonts/OFL.txt`.
