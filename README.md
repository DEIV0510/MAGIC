# MAGIC WORLD — tienda online

Chaquetas, buzos y abrigos para hombre y mujer. Sitio estático (Astro 7) con bolsa de
compra (color + talla), total con envío incluido y pedido por WhatsApp (323 898 7323).
Listo para pasar a Shopify: ver [`shopify/GUIA.md`](shopify/GUIA.md).

En vivo: https://magic-tienda.vercel.app

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
shopify/           productos.csv + GUIA.md para importar
src/data/          catalog.json, marca, logotipo, manifiestos de imagen y video
src/components/    piezas de la interfaz (home/ = secciones de la portada)
src/commerce/      bolsa y proveedores de checkout
src/scripts/       interacción (home y ficha se cargan aparte)
src/styles/        tokens, base, chrome (header/diálogos/footer), home y tienda
public/shopify/    JPG estables que Shopify descarga al importar
```

Tipografía: Mona Sans (SIL OFL 1.1, © GitHub), licencia en `scripts/fonts/OFL.txt`.
