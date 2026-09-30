// Carrito de Shopify (API AJAX): la bolsa, la vista rápida y la ficha lo usan.
// El total y los precios SIEMPRE salen de /cart.js (descuentos incluidos).
import { cfg } from './env';

export interface CartOption {
  name: string;
  value: string;
}

export interface CartItem {
  key: string;
  id: number;
  quantity: number;
  handle: string;
  product_title: string;
  url: string;
  image: string | null;
  options_with_values: CartOption[];
  final_line_price: number;
}

export interface ShopifyCart {
  item_count: number;
  total_price: number;
  items: CartItem[];
}

type Listener = (c: ShopifyCart) => void;
const listeners = new Set<Listener>();
let current: ShopifyCart | null = null;

export class CartError extends Error {}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${cfg.root}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new CartError((data as { description?: string }).description || 'No se pudo actualizar la bolsa.');
  return data as T;
}

const notify = () => {
  if (current) listeners.forEach((fn) => fn(current!));
};

export const cart = {
  get current() {
    return current;
  },
  async refresh() {
    current = await request<ShopifyCart>('cart.js');
    notify();
    return current;
  },
  async add(id: number, quantity = 1) {
    await request('cart/add.js', { items: [{ id, quantity }] });
    return cart.refresh();
  },
  async change(key: string, quantity: number) {
    current = await request<ShopifyCart>('cart/change.js', { id: key, quantity });
    notify();
    return current;
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    if (current) fn(current);
  },
};

/** Talla / color de una línea según el nombre de la opción (las de la tienda varían: "TALLA ", "Talla", "TALLAS"). */
export const optionOf = (item: CartItem, kind: 'color' | 'size') =>
  item.options_with_values.find((o) => {
    const n = o.name.trim().toLowerCase();
    return kind === 'color' ? /^colou?r(es)?$/.test(n) : /^(talla|tallas|size|sizes)$/.test(n);
  })?.value ?? null;
