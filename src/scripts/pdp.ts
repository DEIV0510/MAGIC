// Ficha de producto: color y talla (radios nativos), galería deslizable con
// contador, color desde ?color=, talla obligatoria para comprar y barra de compra
// fija en móvil.
import { addToBag } from './bag';
import { rafThrottle } from './env';
import { findItem } from './shopdata';

export function initPdp() {
  const pdp = document.querySelector<HTMLElement>('[data-pdp]');
  const form = pdp?.querySelector<HTMLFormElement>('[data-pdp-form]');
  if (!pdp || !form) return;
  const item = findItem(pdp.dataset.slug!);
  const sets = [...pdp.querySelectorAll<HTMLElement>('[data-set]')];
  const count = pdp.querySelector<HTMLElement>('[data-count]');
  const colorName = pdp.querySelector<HTMLElement>('[data-color-name]');
  const buybarColor = document.querySelector<HTMLElement>('[data-buybar-color]');
  const sizeField = pdp.querySelector<HTMLElement>('[data-size-field]');
  const sizeError = pdp.querySelector<HTMLElement>('[data-size-error]');
  // Solo los enlaces de ESTA prenda (no los de las tarjetas relacionadas).
  const waLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-wa-product]')].filter((a) => !a.closest('[data-card]'));
  const colorInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="color"]')];
  const sizeInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="size"]')];

  const activeSet = () => sets.find((s) => s.classList.contains('is-active'));
  const selectedColor = () => colorInputs.find((i) => i.checked) ?? colorInputs[0];
  const selectedSize = () => sizeInputs.find((i) => i.checked)?.value ?? null;

  const updateCount = () => {
    const set = activeSet();
    if (!count || !set) return;
    const shots = set.children.length;
    const i = Math.round(set.scrollLeft / Math.max(1, set.clientWidth)) + 1;
    count.textContent = `${Math.min(i, shots)} / ${shots}`;
    count.hidden = shots < 2;
  };

  const showColor = (input: HTMLInputElement, updateUrl = true) => {
    const id = input.value;
    sets.forEach((s) => {
      const on = s.dataset.set === id;
      s.classList.toggle('is-active', on);
      if (on) s.scrollLeft = 0;
    });
    if (colorName) colorName.textContent = input.dataset.label ?? '';
    if (buybarColor) buybarColor.textContent = input.dataset.label ?? '';
    if (input.dataset.wa) waLinks.forEach((a) => (a.href = input.dataset.wa!));
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (input === colorInputs[0]) url.searchParams.delete('color');
      else url.searchParams.set('color', id);
      history.replaceState(history.state, '', url);
    }
    updateCount();
  };

  const setInvalid = (on: boolean) => {
    if (sizeError) sizeError.hidden = !on;
    sizeField?.classList.toggle('opt--invalid', on);
  };

  /** Valida la talla y agrega. Devuelve false si falta la talla. */
  const add = (mode: 'open' | 'toast') => {
    if (!item) return false;
    const size = selectedSize();
    if (sizeInputs.length && !size) {
      setInvalid(true);
      sizeField?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      sizeInputs[0].focus({ preventScroll: true });
      return false;
    }
    const input = selectedColor();
    const color = item.c.find((c) => c.id === input?.value) ?? item.c[0];
    const photo = activeSet()?.querySelector<HTMLImageElement>('img');
    addToBag(
      { slug: item.s, name: item.n, colorId: color?.id ?? null, colorLabel: color?.l ?? null, size, image: color?.i ?? null, price: item.p, bg: color?.b ?? null },
      mode,
      photo,
    );
    return true;
  };

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'color') showColor(t);
    if (t.name === 'size') setInvalid(false);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    add('open');
  });
  pdp.querySelector('[data-pdp-add]')?.addEventListener('click', () => add('toast'));
  document.querySelector('[data-pdp-buybar]')?.addEventListener('click', () => add('open'));

  const wanted = new URL(window.location.href).searchParams.get('color');
  const initial = colorInputs.find((i) => i.value === wanted);
  if (initial) {
    initial.checked = true;
    showColor(initial, false);
  }

  sets.forEach((s) => s.addEventListener('scroll', updateCount, { passive: true }));
  updateCount();

  // Escritorio: la galería se queda fija solo si cabe entera en la pantalla.
  const gallery = pdp.querySelector<HTMLElement>('.pdp__gallery');
  const header = document.querySelector<HTMLElement>('header.hdr');
  const wide = matchMedia('(min-width: 1024px)');
  const fitGallery = () => {
    const h = activeSet()?.offsetHeight ?? 0;
    const room = window.innerHeight - (header?.offsetHeight ?? 64) - 8;
    gallery?.classList.toggle('is-sticky', wide.matches && h > 0 && h <= room);
  };
  window.addEventListener('resize', rafThrottle(fitGallery), { passive: true });
  form.addEventListener('change', () => requestAnimationFrame(fitGallery));
  window.addEventListener('load', fitGallery);
  fitGallery();

  // Barra fija: aparece cuando los botones principales quedaron por encima de la
  // pantalla. Se mide en cada scroll (un IntersectionObserver no avisa si un salto
  // —ancla, volver atrás— pasa el elemento de abajo a arriba sin cruzar la vista).
  const bar = document.querySelector<HTMLElement>('[data-buybar]');
  const main = pdp.querySelector<HTMLElement>('[data-main-cta]');
  if (bar && main) {
    let shown: boolean | null = null;
    const check = () => {
      const show = main.getBoundingClientRect().bottom < 0;
      if (show === shown) return;
      shown = show;
      bar.classList.toggle('is-visible', show);
      bar.inert = !show;
    };
    window.addEventListener('scroll', rafThrottle(check), { passive: true });
    window.addEventListener('resize', rafThrottle(check), { passive: true });
    check();
  }
}
