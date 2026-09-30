# Pasar MAGIC WORLD a Shopify

Todo el catálogo ya está listo en **`productos.csv`** (formato actual de Shopify: los
encabezados son idénticos a su plantilla oficial).

| | |
|---|---|
| Productos | 11 (con precio, colores y tallas) |
| Variantes | 124 (cada color × cada talla, con su SKU `MW-…`) |
| Fotos | 38, a resolución completa; cada color muestra su foto |
| Pendiente | **Chaqueta deportiva táctica**: falta precio y tallas (no va en el CSV) |

## Antes de importar

1. **La web tiene que estar publicada** con esta versión: Shopify descarga las fotos
   desde `https://magic-tienda.vercel.app/shopify/…jpg`. Si la web no está al día, las
   fotos no cargan.
2. En Shopify, la moneda de la tienda debe ser **peso colombiano (COP)**
   (Configuración → General → Moneda de la tienda).

## Importar (una sola vez)

1. Shopify → **Productos** → **Importar**.
2. Sube `productos.csv`. La primera vez **no** marques «Sobrescribir productos».
3. Revisa la vista previa y pulsa **Importar productos**. Shopify te avisa por correo al
   terminar (tarda unos minutos por las fotos).

No abras ni guardes el CSV con Excel: le cambia las tildes. Si hay que editar algo, se
cambia en la web (`src/data/catalog.json`) y se vuelve a generar con `npm run shopify`.

## Después de importar

- **Envío**: los precios ya incluyen el envío. En Configuración → Envío y entrega, crea
  una tarifa para Colombia de **$0** llamada «Envío incluido».
- **Impuestos**: si cobras IVA, en Configuración → Impuestos y aranceles marca
  **«Todos los precios incluyen impuestos»**, para que el cliente pague exactamente el
  precio publicado ($79.990, no $79.990 + IVA).
- **Colecciones**: crea colecciones **automáticas** por etiqueta:
  `Hombre`, `Mujer`, `Chaquetas`, `Buzos` y `Destacado` (las 5 prendas prioritarias).
- **Inventario**: se importa **sin seguimiento** (siempre disponible), porque no tenemos
  cantidades. Para controlar stock: en cada producto activa «Hacer seguimiento de la
  cantidad» y carga las unidades por talla.
- **Chaqueta deportiva táctica**: en cuanto tengas precio y tallas, se agregan a
  `catalog.json` y el CSV nuevo ya la incluye.

## Conectar la web al pago de Shopify (opcional)

La web puede seguir tal cual y cobrar con Shopify: la bolsa manda el pedido al checkout
de Shopify en vez de WhatsApp. Ya está programado; solo falta conectarlo:

1. En Shopify instala el canal **Headless** y crea un *storefront*; copia el
   **token público de la Storefront API**.
2. Publica los productos también en ese canal.
3. Pásame el dominio `tu-tienda.myshopify.com` y el token: se ponen en Vercel
   (`PUBLIC_SHOPIFY_DOMAIN`, `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`) y se vuelve a publicar.

La web encuentra cada variante sola por **URL handle + Color + Talla** (son los mismos
nombres del CSV), así que no hay que copiar códigos a mano. Si algo falla, el pedido
sigue saliendo por WhatsApp.
