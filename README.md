# MAGIC — tienda online

Chaquetas y buzos para hombre y mujer. Sitio estático (Astro 7) con bolsa de compra y
pedido por WhatsApp (323 898 7323). Todo el contenido sale de las fotos reales de la
carpeta MAGIC; no hay imágenes de stock ni generadas.

## Uso

```bash
npm install
npm run dev        # http://localhost:5441
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:5442
```

`npm run images` vuelve a generar las fotos web (AVIF + WebP, sin ampliar nunca) desde
`assets/source/` y el recorte con alfa del chaquetón. `npm run brand` regenera logotipo,
favicon e imágenes para compartir (`public/og/`).

## Dónde se cambia cada cosa

| Qué | Archivo |
|---|---|
| Productos, colores, detalles, **precios** y **tallas** | `src/data/products.ts` (`price` y `sizes` están en `null` a propósito) |
| WhatsApp, redes sociales | `src/data/site.ts` (las redes en `null` no se muestran) |
| Textos de los mensajes de WhatsApp | `src/lib/whatsapp.ts` |
| Fotos nuevas | copiar a `assets/source/`, registrarlas en `scripts/images.config.mjs`, `npm run images` |
| Colores de marca y tipografía | `src/styles/tokens.css` |

## Compra

- La bolsa se guarda en el navegador (`localStorage`) y el botón **Finalizar pedido**
  abre WhatsApp con las prendas, colores y cantidades.
- `src/commerce/` separa la interfaz del proveedor de pago: `whatsapp.ts` (activo) y
  `shopify.ts` (preparado, **no probado**: no hay tienda Shopify conectada). Para activarlo,
  definir `PUBLIC_SHOPIFY_DOMAIN` y `PUBLIC_SHOPIFY_STOREFRONT_TOKEN` y cargar los ids de
  variante en `shopifyVariants` de cada producto.

## Pendiente del cliente

- Precios y tallas de cada prenda.
- Fotos de la **Chaqueta UFC combinada** y la **Chaqueta Nature Flow** (hoy se muestran
  solo con su nombre y botón de WhatsApp).
- Redes sociales (Instagram, TikTok…).
- Condiciones de pago, cambios y envíos, si se quieren publicar.
- Dominio: al publicar, definir `SITE_URL` para que canonical, Open Graph y sitemap
  salgan con URL absoluta.

## Estructura

```
assets/source/     fotos originales (copias exactas) + ORIGEN.md
scripts/           imágenes, recorte, marca y servidor de vista previa
src/data/          catálogo, marca, logotipo y manifiesto de imágenes
src/components/    piezas de la interfaz (home/ = secciones de la portada)
src/commerce/      bolsa y proveedores de checkout
src/scripts/       interacción (un módulo por tarea; home y ficha se cargan aparte)
src/styles/        tokens, base, chrome (header/diálogos/footer), home y tienda
```

Tipografía: Mona Sans (SIL OFL 1.1, © GitHub), licencia en `scripts/fonts/OFL.txt`.
