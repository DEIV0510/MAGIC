/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Dominio de la tienda Shopify (p. ej. magic.myshopify.com). Vacío = checkout por WhatsApp. */
  readonly PUBLIC_SHOPIFY_DOMAIN?: string;
  /** Token público de la Storefront API. */
  readonly PUBLIC_SHOPIFY_STOREFRONT_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __magicFallback?: number;
}
