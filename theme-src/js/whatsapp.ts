// Mensajes de WhatsApp (el número sale de la configuración del tema).
import { cfg, money } from './env';

export const waLink = (text?: string) => `https://wa.me/${cfg.wa}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export function productMessage(name: string, color?: string | null, cents?: number | null) {
  const colorPart = color ? ` en color ${color.toLowerCase()}` : '';
  const pricePart = cents ? ` (${money(cents)}, envío incluido)` : '';
  return `Hola ${cfg.brand}, me interesa la prenda ${name}${colorPart}${pricePart}. ¿Me confirmas las tallas disponibles?`;
}

export interface OrderLineLike {
  name: string;
  color: string | null;
  size: string | null;
  qty: number;
  cents: number;
}

export function orderMessage(lines: OrderLineLike[], totalCents: number) {
  const body = lines
    .map((l, i) => {
      const parts = [l.color ?? 'Color por confirmar', l.size ? `Talla ${l.size}` : 'Talla por confirmar', `Cantidad ${l.qty}`].join(' · ');
      return `${i + 1}. ${l.name}\n   ${parts}\n   ${money(l.cents)}`;
    })
    .join('\n');
  return `Hola ${cfg.brand}, quiero hacer este pedido:\n\n${body}\n\nTotal: ${money(totalCents)} (envío incluido)\n\n¿Me confirmas disponibilidad?`;
}
