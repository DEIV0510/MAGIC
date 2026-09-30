// Proveedor PREPARADO (inactivo): checkout real con la Storefront API de Shopify.
// Se activa solo si existen PUBLIC_SHOPIFY_DOMAIN y PUBLIC_SHOPIFY_STOREFRONT_TOKEN.
// No hace falta copiar ids a mano: cada línea se resuelve por el handle del producto
// (= slug de la web, igual que en shopify/productos.csv) y sus opciones Color/Talla.
// Sin tienda conectada no se ha probado contra un Shopify real.
import type { CartLine, CheckoutProvider } from './types';

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_DOMAIN;
const TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = '2026-07';

async function storefront<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN as string },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify respondió ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

const VARIANT = `query variant($handle: String!, $options: [SelectedOptionInput!]!) {
  product(handle: $handle) { variantBySelectedOptions(selectedOptions: $options) { id availableForSale } }
}`;

const CART_CREATE = `mutation cartCreate($input: CartInput!) {
  cartCreate(input: $input) { cart { checkoutUrl } userErrors { field message } }
}`;

async function variantId(line: CartLine) {
  const options = [
    ...(line.colorLabel ? [{ name: 'Color', value: line.colorLabel }] : []),
    ...(line.size ? [{ name: 'Talla', value: line.size }] : []),
  ];
  const data = await storefront<{ product: { variantBySelectedOptions: { id: string; availableForSale: boolean } | null } | null }>(VARIANT, {
    handle: line.slug,
    options,
  });
  const v = data.product?.variantBySelectedOptions;
  if (!v) throw new Error(`Sin variante en Shopify para ${line.slug} ${line.colorLabel ?? ''} ${line.size ?? ''}`);
  if (!v.availableForSale) throw new Error(`${line.name} (${line.colorLabel}, ${line.size}) está agotada en Shopify`);
  return v.id;
}

export const shopifyConfigured = () => Boolean(DOMAIN && TOKEN);

export const shopifyProvider: CheckoutProvider = {
  id: 'shopify',
  // Solo prendas con precio y talla: las demás se cotizan por WhatsApp.
  canHandle: (lines) => shopifyConfigured() && lines.length > 0 && lines.every((l) => l.price !== null && l.size !== null),
  async checkout(lines) {
    const merch = await Promise.all(lines.map(async (l) => ({ merchandiseId: await variantId(l), quantity: l.qty })));
    const data = await storefront<{ cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } }>(CART_CREATE, {
      input: { lines: merch },
    });
    const url = data.cartCreate.cart?.checkoutUrl;
    if (!url) throw new Error(data.cartCreate.userErrors[0]?.message ?? 'Shopify no devolvió checkoutUrl');
    window.location.href = url;
  },
};
