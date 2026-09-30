// Buscador sobre el catálogo real (#shop-data, incrustado en cada página).
// Sin tildes ni mayúsculas: "chaqueton" encuentra "Chaquetón".
import { money } from './env';
import { itemUrl, shopData, type ShopItem } from './shopdata';

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function highlight(name: string, terms: string[]) {
  const n = norm(name);
  const marks = new Array(name.length).fill(false);
  for (const t of terms) {
    let from = 0;
    let at: number;
    while (t && (at = n.indexOf(t, from)) !== -1) {
      for (let k = at; k < at + t.length && k < marks.length; k++) marks[k] = true;
      from = at + t.length;
    }
  }
  const frag = document.createDocumentFragment();
  let buf = '';
  let on = false;
  const flush = () => {
    if (!buf) return;
    if (on) {
      const m = document.createElement('mark');
      m.textContent = buf;
      frag.append(m);
    } else frag.append(buf);
    buf = '';
  };
  for (let k = 0; k < name.length; k++) {
    if (marks[k] !== on) {
      flush();
      on = marks[k];
    }
    buf += name[k];
  }
  flush();
  return frag;
}

export function initSearch() {
  const dialog = document.getElementById('search') as HTMLDialogElement | null;
  const input = dialog?.querySelector<HTMLInputElement>('[data-search-input]');
  const results = dialog?.querySelector<HTMLElement>('[data-search-results]');
  const hint = dialog?.querySelector<HTMLElement>('[data-search-hint]');
  const empty = dialog?.querySelector<HTMLElement>('[data-search-empty]');
  const status = dialog?.querySelector<HTMLElement>('[data-search-status]');
  const form = dialog?.querySelector<HTMLFormElement>('[data-search-form]');
  if (!dialog || !input || !results) return;

  const index: (ShopItem & { hay: string })[] = shopData().map((e) => ({ ...e, hay: norm(e.k) }));

  const render = () => {
    const q = norm(input.value.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    results.replaceChildren();
    if (!terms.length) {
      if (hint) hint.hidden = false;
      if (empty) empty.hidden = true;
      if (status) status.textContent = 'Categorías';
      return;
    }
    const found = index.filter((e) => terms.every((t) => e.hay.includes(t))).slice(0, 8);
    if (hint) hint.hidden = true;
    if (empty) empty.hidden = found.length > 0;
    if (status) status.textContent = found.length ? `${found.length} ${found.length === 1 ? 'resultado' : 'resultados'}` : 'Sin resultados';

    for (const e of found) {
      // Si la búsqueda nombra un color, se muestra y enlaza ese color.
      const hit = e.c.find((c) => terms.some((t) => norm(c.l).includes(t)));
      const thumb = hit ?? e.c[0] ?? null;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = itemUrl(e, hit);
      const th = document.createElement('span');
      th.className = 'search__thumb frame';
      if (thumb?.i) {
        const img = document.createElement('img');
        img.dataset.bg = thumb.b;
        img.src = thumb.i;
        img.alt = '';
        img.width = 56;
        img.height = 70;
        img.decoding = 'async';
        th.append(img);
      }
      const text = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'search__name';
      name.append(highlight(e.n, terms));
      const tag = document.createElement('span');
      tag.className = 'search__tag';
      tag.textContent = [e.a ? money(e.p) : 'Agotado', e.c.map((c) => c.l).join(' · ')].filter(Boolean).join(' — ');
      text.append(name, tag);
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('viewBox', '0 0 24 24');
      arrow.setAttribute('fill', 'none');
      arrow.setAttribute('stroke', 'currentColor');
      arrow.setAttribute('stroke-width', '1.5');
      arrow.setAttribute('aria-hidden', 'true');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M3.5 12h16M14 6.5 19.5 12 14 17.5');
      arrow.append(p);
      a.append(th, text, arrow);
      li.append(a);
      results.append(li);
    }
  };

  input.addEventListener('input', render);

  form?.addEventListener('submit', (e) => {
    const first = results.querySelector<HTMLAnchorElement>('a');
    // Con resultados, Enter abre el primero; sin ellos, la página de búsqueda de Shopify.
    if (first) {
      e.preventDefault();
      window.location.href = first.href;
    } else if (!input.value.trim()) e.preventDefault();
  });

  // Flechas: del campo a los resultados y entre resultados.
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...results.querySelectorAll<HTMLAnchorElement>('a')];
    if (!links.length) return;
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    e.preventDefault();
    if (e.key === 'ArrowDown') (links[i + 1] ?? links[0]).focus();
    else if (i <= 0) input.focus();
    else links[i - 1].focus();
  });

  dialog.addEventListener('close', () => {
    input.value = '';
    render();
  });
}
