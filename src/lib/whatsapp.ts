// Mensajes de WhatsApp: se usan tanto en el HTML estático como en el navegador.
import { site } from '@/data/site';

export const waLink = (text?: string) =>
  `https://wa.me/${site.whatsapp.number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

const money = (n: number) => `$${Math.round(n).toLocaleString('es-CO').replace(/,/g, '.')}`;

export const generalMessage = () => `Hola ${site.name}, quiero ver la colección. ¿Me ayudas con tallas y colores?`;

export function productMessage(name: string, color?: string | null, price?: number | null) {
  const colorPart = color ? ` en color ${color.toLowerCase()}` : '';
  const pricePart = price ? ` (${money(price)}, envío incluido)` : '';
  const ask = price ? '¿Me confirmas las tallas disponibles?' : '¿Me confirmas precio y tallas disponibles?';
  return `Hola ${site.name}, me interesa la prenda ${name}${colorPart}${pricePart}. ${ask}`;
}

export interface OrderLineLike {
  name: string;
  colorLabel: string | null;
  size: string | null;
  qty: number;
  price: number | null;
}

export function orderMessage(lines: OrderLineLike[]) {
  const body = lines
    .map((l, i) => {
      const parts = [l.colorLabel ?? 'Color por confirmar', l.size ? `Talla ${l.size}` : 'Talla por confirmar', `Cantidad ${l.qty}`].join(' · ');
      const price = l.price ? `\n   ${money(l.price * l.qty)}` : '\n   Precio por confirmar';
      return `${i + 1}. ${l.name}\n   ${parts}${price}`;
    })
    .join('\n');
  const priced = lines.filter((l) => l.price);
  const total = priced.reduce((s, l) => s + (l.price ?? 0) * l.qty, 0);
  const allPriced = priced.length === lines.length;
  const totalLine = total ? `\n\nTotal: ${money(total)}${allPriced ? '' : ' + prendas por cotizar'} (envío incluido)` : '';
  return `Hola ${site.name}, quiero hacer este pedido:\n\n${body}${totalLine}\n\n¿Me confirmas disponibilidad para hacer el pago?`;
}
