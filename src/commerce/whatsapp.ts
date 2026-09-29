// Proveedor ACTIVO: el pedido se envía por WhatsApp al 323 898 7323.
import type { CheckoutProvider } from './types';
import { orderMessage, waLink } from '@/lib/whatsapp';

/** Abre un enlace externo en otra pestaña; si el navegador lo bloquea, navega aquí mismo. */
export function openExternal(url: string) {
  const w = window.open(url, '_blank');
  if (w) {
    try {
      w.opener = null;
    } catch {
      /* algunos navegadores no permiten tocar opener */
    }
  } else {
    window.location.href = url;
  }
}

export const whatsappProvider: CheckoutProvider = {
  id: 'whatsapp',
  canHandle: (lines) => lines.length > 0,
  async checkout(lines) {
    openExternal(waLink(orderMessage(lines)));
  },
};
