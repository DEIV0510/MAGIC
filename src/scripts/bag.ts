// Bolsa: pinta las líneas (color, talla, precio), calcula el total, re-precia con
// el catálogo actual al cargar y finaliza el pedido con el proveedor activo
// (WhatsApp hoy; Shopify cuando se conecte). addToBag() la usan la vista rápida
// y la ficha de producto.
import { cart } from '@/commerce/cart';
import { checkout } from '@/commerce/checkout';
import type { CartLine, NewLine } from '@/commerce/types';
import { openDialog } from './dialogs';
import { motionOK } from './env';
import { findItem, itemUrl, money } from './shopdata';

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(d: string) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'square');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function lineNode(l: CartLine) {
  const li = el('li');
  li.dataset.line = l.key;

  const thumb = el('div', 'bag__thumb frame');
  if (l.image) {
    const img = el('img');
    img.src = l.image;
    img.alt = '';
    img.width = 84;
    img.height = 105;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.dataset.bg = l.bg ?? 'photo';
    thumb.append(img);
  }

  const body = el('div', 'bag__info');
  const top = el('div', 'bag__row bag__row--top');
  const item = findItem(l.slug);
  const color = item?.c.find((c) => c.id === l.colorId) ?? null;
  const name = el('a', 'bag__name', l.name);
  name.setAttribute('href', item ? itemUrl(item, color) : `/producto/${l.slug}/`);
  const price = el('p', 'bag__price', l.price ? money(l.price * l.qty) : 'Por confirmar');
  top.append(name, price);
  const meta = el('p', 'bag__meta', [l.colorLabel ?? 'Color por confirmar', l.size ? `Talla ${l.size}` : 'Talla por WhatsApp'].join(' · '));

  const row = el('div', 'bag__row');
  const qty = el('div', 'qty');
  const minus = el('button');
  minus.type = 'button';
  minus.dataset.act = 'minus';
  minus.setAttribute('aria-label', `Quitar una unidad de ${l.name}`);
  minus.append(icon('M5 12h14'));
  const out = el('output', undefined, String(l.qty));
  out.setAttribute('aria-label', `Cantidad: ${l.qty}`);
  const plus = el('button');
  plus.type = 'button';
  plus.dataset.act = 'plus';
  plus.setAttribute('aria-label', `Agregar una unidad de ${l.name}`);
  plus.append(icon('M12 5v14M5 12h14'));
  qty.append(minus, out, plus);

  const remove = el('button', 'bag__remove', 'Quitar');
  remove.type = 'button';
  remove.dataset.act = 'remove';
  remove.setAttribute('aria-label', `Quitar ${l.name} de la bolsa`);

  row.append(qty, remove);
  body.append(top, meta, row);
  li.append(thumb, body);
  return li;
}

let live: HTMLElement | null = null;
function announce(msg: string) {
  if (!live) {
    live = el('p', 'sr-only');
    live.setAttribute('aria-live', 'polite');
    document.body.append(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => {
    if (live) live.textContent = msg;
  });
}

let toastEl: HTMLElement | null = null;
let toastTimer = 0;
function toast(text: string) {
  if (!toastEl) {
    toastEl = el('div', 'toast');
    toastEl.setAttribute('role', 'status');
    const msg = el('span', 'toast__msg');
    const btn = el('button', 'toast__btn', 'Ver bolsa');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      hideToast();
      openDialog('bag');
    });
    toastEl.append(msg, btn);
    document.body.append(toastEl);
  }
  toastEl.querySelector('.toast__msg')!.textContent = text;
  requestAnimationFrame(() => toastEl?.classList.add('is-on'));
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(hideToast, 3200);
}
function hideToast() {
  toastEl?.classList.remove('is-on');
}

/** Vuela una copia de la foto hasta el icono de la bolsa. */
function flyToBag(src: HTMLImageElement | null) {
  if (!motionOK || !src?.currentSrc) return;
  const target = [...document.querySelectorAll<HTMLElement>('[data-bag-button]')].find((b) => b.offsetParent !== null);
  if (!target) return;
  const a = src.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (a.width === 0) return;
  const ghost = el('img', 'fly');
  ghost.src = src.currentSrc;
  ghost.alt = '';
  ghost.dataset.bg = src.dataset.bg ?? 'photo';
  Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.append(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = ghost.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 0.95 },
      { transform: `translate(${dx}px, ${dy}px) scale(${Math.max(0.04, 24 / a.width)})`, opacity: 0.2 },
    ],
    { duration: 780, easing: 'cubic-bezier(.7,0,.3,1)' },
  );
  anim.onfinish = anim.oncancel = () => ghost.remove();
}

function bump() {
  document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((c) => {
    c.classList.remove('is-bump');
    void c.offsetWidth;
    c.classList.add('is-bump');
  });
}

/** Agrega a la bolsa. mode 'open' = abre la bolsa (comprar); 'toast' = aviso + foto que vuela. */
export function addToBag(line: NewLine, mode: 'open' | 'toast', photo?: HTMLImageElement | null) {
  cart.add(line);
  bump();
  const what = [line.name, line.colorLabel?.toLowerCase(), line.size ? `talla ${line.size}` : null].filter(Boolean).join(', ');
  announce(`${what}: agregado a la bolsa. ${cart.count()} en total.`);
  if (mode === 'open') {
    window.setTimeout(() => openDialog('bag'), motionOK ? 200 : 0);
  } else {
    flyToBag(photo ?? null);
    toast(`${line.name} · ${line.size ? `Talla ${line.size}` : line.colorLabel ?? ''} — en tu bolsa`);
  }
}

export function initBag() {
  const list = document.querySelector<HTMLElement>('[data-bag-lines]');
  const empty = document.querySelector<HTMLElement>('[data-bag-empty]');
  const foot = document.querySelector<HTMLElement>('[data-bag-foot]');
  const total = document.querySelector<HTMLElement>('[data-bag-total]');
  const note = document.querySelector<HTMLElement>('[data-bag-note]');
  const titleCount = document.querySelector<HTMLElement>('[data-bag-title-count]');

  // Precios, nombres y fotos siempre del catálogo publicado; lo que ya no existe se quita.
  cart.reconcile((l) => {
    const item = findItem(l.slug);
    if (!item) return null;
    const color = l.colorId ? item.c.find((c) => c.id === l.colorId) : null;
    if (l.colorId && !color) return null;
    if (l.size && item.z && !item.z.includes(l.size)) return null;
    return { ...l, name: item.n, price: item.p, colorLabel: color?.l ?? l.colorLabel, image: color?.i ?? l.image, bg: color?.b ?? l.bg };
  });

  const render = (lines: readonly CartLine[]) => {
    const count = cart.count();
    document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((c) => {
      c.textContent = String(count);
      c.toggleAttribute('data-empty', count === 0);
    });
    document.querySelectorAll<HTMLElement>('[data-bag-button]').forEach((b) =>
      b.setAttribute('aria-label', count ? `Bolsa, ${count} ${count === 1 ? 'prenda' : 'prendas'}` : 'Bolsa, vacía'),
    );
    if (titleCount) titleCount.textContent = count ? `(${count})` : '';

    const priced = lines.filter((l) => l.price !== null);
    const sum = priced.reduce((s, l) => s + (l.price ?? 0) * l.qty, 0);
    const pending = lines.length - priced.length;
    if (total) total.textContent = sum ? `${money(sum)}${pending ? ' + por confirmar' : ''}` : 'Por confirmar';
    if (note) note.textContent = pending ? 'Envío incluido. Las prendas sin precio te las cotizamos por WhatsApp.' : 'Envío incluido. Confirmamos tu pedido por WhatsApp.';

    if (!list) return;
    // Conservar el foco al volver a pintar (botones + / − / Quitar).
    const active = document.activeElement as HTMLElement | null;
    const focusKey = active?.closest<HTMLElement>('[data-line]')?.dataset.line;
    const focusAct = active?.dataset.act;

    list.replaceChildren(...lines.map(lineNode));
    if (empty) empty.hidden = lines.length > 0;
    if (foot) foot.hidden = lines.length === 0;

    if (focusKey && focusAct) {
      const again = list.querySelector<HTMLElement>(`[data-line="${CSS.escape(focusKey)}"] [data-act="${focusAct}"]`);
      (again ?? list.querySelector<HTMLElement>('[data-act]') ?? empty?.querySelector<HTMLElement>('a'))?.focus();
    }
  };

  cart.subscribe(render);

  list?.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-act]');
    const key = btn?.closest<HTMLElement>('[data-line]')?.dataset.line;
    if (!btn || !key) return;
    const line = cart.lines.find((l) => l.key === key);
    if (!line) return;
    if (btn.dataset.act === 'plus') cart.setQty(key, line.qty + 1);
    if (btn.dataset.act === 'minus') cart.setQty(key, line.qty - 1);
    if (btn.dataset.act === 'remove') {
      cart.remove(key);
      announce(`${line.name} se quitó de la bolsa.`);
    }
  });

  document.addEventListener('click', async (e) => {
    const go = (e.target as Element).closest<HTMLButtonElement>('[data-checkout]');
    if (!go || !cart.lines.length) return;
    go.setAttribute('aria-busy', 'true');
    await checkout(cart.lines);
    window.setTimeout(() => go.removeAttribute('aria-busy'), 800);
  });
}
