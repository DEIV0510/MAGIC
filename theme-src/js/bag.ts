// Bolsa: pinta el carrito de Shopify (color, talla, precio), calcula el total con
// /cart.js y lleva a pagar: con Releasit (pago contraentrega) a /cart, donde la app
// abre su formulario; sin Releasit, al checkout de Shopify. addToBag() la usan la
// vista rápida y la ficha de producto.
import { cart, CartError, optionOf, type CartItem, type ShopifyCart } from './cart';
import { openDialog } from './dialogs';
import { cfg, codCart, codOn, money, motionOK } from './env';
import { findItem } from './shopdata';
import { orderMessage, waLink } from './whatsapp';

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

const withWidth = (url: string, w: number) => (url.includes('?') ? `${url}&width=${w}` : `${url}?width=${w}`);

/** Nombre, color, talla y miniatura de una línea, con los datos de la web cuando existen. */
export function describe(l: CartItem) {
  const item = findItem(l.handle);
  const colorValue = optionOf(l, 'color');
  const color = colorValue ? item?.c.find((c) => c.v === colorValue) ?? null : null;
  const label = color?.l ?? (colorValue ? colorValue.charAt(0) + colorValue.slice(1).toLowerCase() : null);
  return {
    name: item?.n ?? l.product_title,
    color: label,
    size: optionOf(l, 'size'),
    image: color?.i ?? (l.image ? withWidth(l.image, 240) : null),
    bg: color?.b ?? 'photo',
  };
}

function lineNode(l: CartItem) {
  const d = describe(l);
  const li = el('li');
  li.dataset.line = l.key;

  const thumb = el('div', 'bag__thumb frame');
  if (d.image) {
    const img = el('img');
    img.src = d.image;
    img.alt = '';
    img.width = 84;
    img.height = 105;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.dataset.bg = d.bg;
    thumb.append(img);
  }

  const body = el('div', 'bag__info');
  const top = el('div', 'bag__row bag__row--top');
  const name = el('a', 'bag__name', d.name);
  name.setAttribute('href', l.url);
  const price = el('p', 'bag__price', money(l.final_line_price));
  top.append(name, price);
  const meta = el('p', 'bag__meta', [d.color, d.size ? `Talla ${d.size}` : null].filter(Boolean).join(' · '));

  const row = el('div', 'bag__row');
  const qty = el('div', 'qty');
  const minus = el('button');
  minus.type = 'button';
  minus.dataset.act = 'minus';
  minus.setAttribute('aria-label', `Quitar una unidad de ${d.name}`);
  minus.append(icon('M5 12h14'));
  const out = el('output', undefined, String(l.quantity));
  out.setAttribute('aria-label', `Cantidad: ${l.quantity}`);
  const plus = el('button');
  plus.type = 'button';
  plus.dataset.act = 'plus';
  plus.setAttribute('aria-label', `Agregar una unidad de ${d.name}`);
  plus.append(icon('M12 5v14M5 12h14'));
  qty.append(minus, out, plus);

  const remove = el('button', 'bag__remove', 'Quitar');
  remove.type = 'button';
  remove.dataset.act = 'remove';
  remove.setAttribute('aria-label', `Quitar ${d.name} de la bolsa`);

  row.append(qty, remove);
  body.append(top, meta, row);
  li.append(thumb, body);
  return li;
}

let live: HTMLElement | null = null;
export function announce(msg: string) {
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
export function toast(text: string, withBag = true) {
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
  (toastEl.querySelector('.toast__btn') as HTMLElement).hidden = !withBag;
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

export interface NewLine {
  id: number;
  name: string;
  color: string | null;
  size: string | null;
}

/** Agrega a la bolsa. mode 'open' = abre la bolsa; 'toast' = aviso + foto que vuela. */
export async function addToBag(line: NewLine, mode: 'open' | 'toast', photo?: HTMLImageElement | null) {
  try {
    const c = await cart.add(line.id, 1);
    bump();
    const what = [line.name, line.color?.toLowerCase(), line.size ? `talla ${line.size}` : null].filter(Boolean).join(', ');
    announce(`${what}: agregado a la bolsa. ${c.item_count} en total.`);
    if (mode === 'open') {
      window.setTimeout(() => openDialog('bag'), motionOK ? 200 : 0);
    } else {
      flyToBag(photo ?? null);
      toast(`${line.name} · ${line.size ? `Talla ${line.size}` : line.color ?? ''} — en tu bolsa`);
    }
    return true;
  } catch (err) {
    toast(err instanceof CartError ? err.message : 'No se pudo agregar. Intenta de nuevo.', false);
    return false;
  }
}

export function initBag() {
  const list = document.querySelector<HTMLElement>('[data-bag-lines]');
  const empty = document.querySelector<HTMLElement>('[data-bag-empty]');
  const foot = document.querySelector<HTMLElement>('[data-bag-foot]');
  const total = document.querySelector<HTMLElement>('[data-bag-total]');
  const titleCount = document.querySelector<HTMLElement>('[data-bag-title-count]');
  const wa = document.querySelector<HTMLAnchorElement>('[data-bag-wa]');
  const note = document.querySelector<HTMLElement>('[data-bag-note]');

  if (note && codOn() && codCart()) note.textContent = note.dataset.cod ?? note.textContent;

  const render = (c: ShopifyCart) => {
    const count = c.item_count;
    document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((n) => {
      n.textContent = String(count);
      n.toggleAttribute('data-empty', count === 0);
    });
    document.querySelectorAll<HTMLElement>('[data-bag-button]').forEach((b) =>
      b.setAttribute('aria-label', count ? `Bolsa, ${count} ${count === 1 ? 'prenda' : 'prendas'}` : 'Bolsa, vacía'),
    );
    if (titleCount) titleCount.textContent = count ? `(${count})` : '';
    if (total) total.textContent = money(c.total_price);
    if (wa) {
      wa.href = waLink(
        orderMessage(
          c.items.map((l) => {
            const d = describe(l);
            return { name: d.name, color: d.color, size: d.size, qty: l.quantity, cents: l.final_line_price };
          }),
          c.total_price,
        ),
      );
    }

    if (!list) return;
    // Conservar el foco al volver a pintar (botones + / − / Quitar).
    const active = document.activeElement as HTMLElement | null;
    const focusKey = active?.closest<HTMLElement>('[data-line]')?.dataset.line;
    const focusAct = active?.dataset.act;

    list.replaceChildren(...c.items.map(lineNode));
    if (empty) empty.hidden = c.items.length > 0;
    if (foot) foot.hidden = c.items.length === 0;

    if (focusKey && focusAct) {
      const again = list.querySelector<HTMLElement>(`[data-line="${CSS.escape(focusKey)}"] [data-act="${focusAct}"]`);
      (again ?? list.querySelector<HTMLElement>('[data-act]') ?? empty?.querySelector<HTMLElement>('a'))?.focus();
    }
  };

  cart.subscribe(render);
  cart.refresh().catch(() => {});
  // Releasit vacía y restaura el carrito al abrir/cerrar su formulario: al volver a la
  // pestaña o desde el historial se relee para que el contador no mienta.
  window.addEventListener('pageshow', (e) => e.persisted && cart.refresh().catch(() => {}));
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && cart.refresh().catch(() => {}));
  document.addEventListener('magic:dialog', (e) => {
    const d = (e as CustomEvent<{ id: string; open: boolean }>).detail;
    if (d?.id === 'bag' && d.open) cart.refresh().catch(() => {});
  });

  list?.addEventListener('click', async (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-act]');
    const key = btn?.closest<HTMLElement>('[data-line]')?.dataset.line;
    const line = cart.current?.items.find((l) => l.key === key);
    if (!btn || !key || !line) return;
    btn.setAttribute('aria-busy', 'true');
    try {
      if (btn.dataset.act === 'plus') await cart.change(key, line.quantity + 1);
      if (btn.dataset.act === 'minus') await cart.change(key, line.quantity - 1);
      if (btn.dataset.act === 'remove') {
        await cart.change(key, 0);
        announce(`${describe(line).name} se quitó de la bolsa.`);
      }
    } catch (err) {
      toast(err instanceof CartError ? err.message : 'No se pudo actualizar la bolsa.', false);
      cart.refresh().catch(() => {});
    } finally {
      btn.removeAttribute('aria-busy');
    }
  });

  document.addEventListener('click', (e) => {
    const go = (e.target as Element).closest<HTMLElement>('[data-checkout]');
    if (!go || !cart.current?.item_count) return;
    e.preventDefault();
    go.setAttribute('aria-busy', 'true');
    // Con pago contraentrega (Releasit) el pedido se cierra en /cart; si no, checkout de Shopify.
    window.location.href = codOn() && codCart() ? cfg.cart : `${cfg.root}checkout`;
  });
}
