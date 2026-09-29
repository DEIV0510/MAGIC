// Bolsa de compra: estado en memoria + localStorage, con aviso a suscriptores
// y sincronización entre pestañas. Se lee ANTES de cualquier escritura.
import type { CartLine, NewLine } from './types';

const KEY = 'magic:bag:v1';
const MAX_QTY = 20;
type Listener = (lines: readonly CartLine[]) => void;

const isLine = (v: unknown): v is CartLine => {
  const l = v as CartLine;
  return !!l && typeof l.key === 'string' && typeof l.slug === 'string' && typeof l.name === 'string' && Number.isInteger(l.qty) && l.qty > 0;
};

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

let lines: CartLine[] = read();
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn(lines);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* modo privado o almacenamiento lleno: la bolsa sigue en memoria */
  }
  emit();
}

export const lineKey = (slug: string, colorId: string | null, size: string | null) =>
  `${slug}:${colorId ?? '-'}:${size ?? '-'}`;

export const cart = {
  get lines(): readonly CartLine[] {
    return lines;
  },
  count() {
    return lines.reduce((n, l) => n + l.qty, 0);
  },
  add(item: NewLine, qty = 1) {
    const key = lineKey(item.slug, item.colorId, item.size);
    const existing = lines.find((l) => l.key === key);
    lines = existing
      ? lines.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l))
      : [...lines, { ...item, key, qty: Math.min(qty, MAX_QTY) }];
    persist();
    return key;
  },
  setQty(key: string, qty: number) {
    lines = qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, MAX_QTY) } : l));
    persist();
  },
  remove(key: string) {
    lines = lines.filter((l) => l.key !== key);
    persist();
  },
  clear() {
    lines = [];
    persist();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    fn(lines);
    return () => listeners.delete(fn);
  },
};

window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  lines = read();
  emit();
});
