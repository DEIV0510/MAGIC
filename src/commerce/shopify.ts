// Proveedor PREPARADO (inactivo): checkout real con la Storefront API de Shopify.
// Se activa solo si existen PUBLIC_SHOPIFY_DOMAIN y PUBLIC_SHOPIFY_STOREFRONT_TOKEN
// y TODAS las líneas traen su variantId (products.ts → shopifyVariants).
// Sin tienda conectada no se ha probado contra un Shopify real.
import type { CheckoutProvider } from './types';

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_DOMAIN;
const TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = '2026-07';

const CART_CREATE = `mutation cartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { checkoutUrl }
    userErrors { field message }
  }
}`;

export const shopifyConfigured = () => Boolean(DOMAIN && TOKEN);

export const shopifyProvider: CheckoutProvider = {
  id: 'shopify',
  canHandle: (lines) => shopifyConfigured() && lines.length > 0 && lines.every((l) => Boolean(l.variantId)),
  async checkout(lines) {
    const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN as string,
      },
      body: JSON.stringify({
        query: CART_CREATE,
        variables: { input: { lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.qty })) } },
      }),
    });
    if (!res.ok) throw new Error(`Shopify respondió ${res.status}`);
    const json = await res.json();
    const url: string | undefined = json?.data?.cartCreate?.cart?.checkoutUrl;
    if (!url) throw new Error(json?.data?.cartCreate?.userErrors?.[0]?.message ?? 'Shopify no devolvió checkoutUrl');
    window.location.href = url;
  },
};
