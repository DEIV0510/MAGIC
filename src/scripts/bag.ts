// Bolsa: pinta las líneas, actualiza contadores, agrega desde cualquier botón
// [data-add] y finaliza el pedido con el proveedor activo (WhatsApp hoy).
import { cart } from '@/commerce/cart';
import { checkout } from '@/commerce/checkout';
import type { CartLine } from '@/commerce/types';
import { openDialog } from './dialogs';
import { motionOK } from './env';

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

  const thumb = el('div', `bag__thumb${l.bg === 'studio' ? ' bag__thumb--studio' : ''}${l.bg === 'text' || !l.image ? ' bag__thumb--text' : ''}`);
  if (l.image && l.bg !== 'text') {
    const img = el('img');
    img.src = l.image;
    img.alt = '';
    img.width = 84;
    img.height = 105;
    img.loading = 'lazy';
    img.decoding = 'async';
    thumb.append(img);
  } else {
    thumb.textContent = (l.mark ?? l.name).toUpperCase();
  }

  const body = el('div');
  const name = el('a', 'bag__name', l.name);
  name.setAttribute('href', `/producto/${l.slug}/${l.colorId ? `?color=${l.colorId}` : ''}`);
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
  body.append(name, meta, row);
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
function flyToBag(from: HTMLElement | null) {
  if (!motionOK || !from) return;
  const target = [...document.querySelectorAll<HTMLElement>('[data-bag-button]')].find((b) => b.offsetParent !== null);
  const src = from.querySelector<HTMLImageElement>('.card__layer.is-active .card__img--main, .pdp__set.is-active img, img');
  if (!target || !src || !src.currentSrc) return;
  const a = src.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (a.width === 0) return;
  const ghost = el('img', 'fly');
  ghost.src = src.currentSrc;
  ghost.alt = '';
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

function confirmButton(btn: HTMLElement) {
  if (btn.dataset.busy) return;
  const roll = btn.querySelector<HTMLElement>('.roll');
  if (!roll) return;
  btn.dataset.busy = '1';
  const original = roll.innerHTML;
  roll.innerHTML = '<span>Agregado</span><span aria-hidden="true">Agregado</span>';
  window.setTimeout(() => {
    roll.innerHTML = original;
    delete btn.dataset.busy;
  }, 1400);
}

export function initBag() {
  const list = document.querySelector<HTMLElement>('[data-bag-lines]');
  const empty = document.querySelector<HTMLElement>('[data-bag-empty]');
  const foot = document.querySelector<HTMLElement>('[data-bag-foot]');
  const titleCount = document.querySelector<HTMLElement>('[data-bag-title-count]');

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
    const t = e.target as Element;

    const add = t.closest<HTMLElement>('[data-add]');
    if (add) {
      const d = add.dataset;
      cart.add({
        slug: d.slug!,
        name: d.name!,
        colorId: d.color || null,
        colorLabel: d.colorLabel || null,
        size: d.size || null,
        image: d.image || null,
        price: null,
        variantId: d.variant || null,
        bg: d.bg || null,
        mark: d.mark || null,
      });
      bump();
      confirmButton(add);
      const what = d.colorLabel ? `${d.name}, ${d.colorLabel.toLowerCase()}` : d.name;
      announce(`${what} agregado a la bolsa. ${cart.count()} en total.`);
      if (add.hasAttribute('data-open-bag')) {
        window.setTimeout(() => openDialog('bag'), motionOK ? 260 : 0);
      } else {
        flyToBag(add.closest<HTMLElement>('[data-card], [data-pdp]'));
        toast(`${what} — en tu bolsa`);
      }
      return;
    }

    const go = t.closest<HTMLButtonElement>('[data-checkout]');
    if (go && cart.lines.length) {
      go.setAttribute('aria-busy', 'true');
      await checkout(cart.lines);
      window.setTimeout(() => go.removeAttribute('aria-busy'), 800);
    }
  });
}
