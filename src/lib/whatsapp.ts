// Mensajes de WhatsApp: se usan tanto en el HTML estático como en el navegador.
import { site } from '@/data/site';

export const waLink = (text?: string) =>
  `https://wa.me/${site.whatsapp.number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const generalMessage = () => 'Hola MAGIC, quiero ver la colección. ¿Me ayudas con precios y tallas?';

export function productMessage(name: string, color?: string | null, url?: string | null) {
  const colorPart = color ? ` en color ${color.toLowerCase()}` : '';
  const ask = color
    ? '¿Me confirmas precio y tallas disponibles?'
    : '¿Me envías fotos, colores y precio?';
  return `Hola MAGIC, me interesa la prenda ${name}${colorPart}. ${ask}${url ? `\n\n${url}` : ''}`;
}

export interface OrderLineLike {
  name: string;
  colorLabel: string | null;
  size: string | null;
  qty: number;
}

export function orderMessage(lines: OrderLineLike[]) {
  const body = lines
    .map((l, i) => {
      const parts = [l.colorLabel ? `Color: ${l.colorLabel}` : 'Color: por confirmar', l.size ? `Talla: ${l.size}` : null, `Cantidad: ${l.qty}`]
        .filter(Boolean)
        .join(' · ');
      return `${i + 1}. ${l.name}\n   ${parts}`;
    })
    .join('\n');
  return `Hola MAGIC, quiero hacer este pedido:\n\n${body}\n\n¿Me confirmas precio, tallas disponibles y envío?`;
}
