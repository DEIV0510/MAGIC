// Punto único de checkout: la UI nunca sabe qué proveedor cobra.
import type { CartLine } from './types';
import { shopifyProvider } from './shopify';
import { whatsappProvider } from './whatsapp';

const providers = [shopifyProvider, whatsappProvider];

export async function checkout(lines: readonly CartLine[]) {
  const list = [...lines];
  for (const p of providers) {
    if (!p.canHandle(list)) continue;
    try {
      await p.checkout(list);
      return p.id;
    } catch (err) {
      console.warn(`[checkout] ${p.id} falló, se intenta el siguiente`, err);
    }
  }
  return null;
}
