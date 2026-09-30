// Ficha de producto: color y talla (radios nativos) → variante de Shopify en el
// input name="id" del formulario de producto (lo lee Releasit), galería deslizable
// con contador, talla obligatoria y barra de compra fija en móvil.
//
// "Pedir ahora" es un enlace a /rsi-btn-overwrite: Releasit (pago contraentrega) lo
// convierte en SU botón (id _rsi-buy-now-button-overwrite) sin cambiarle el diseño.
// Antes de dejarle el clic se valida la talla; si la app aún no cargó, se espera.
import { addToBag, toast } from './bag';
import { cart } from './cart';
import { cfg, codOn, hideAdd, money, rafThrottle } from './env';
import { productMessage, waLink } from './whatsapp';

interface PVariant {
  id: number;
  options: string[];
  available: boolean;
  price: number;
  compare_at_price: number | null;
}

const RSI_ID = '_rsi-buy-now-button-overwrite';

export function initPdp() {
  const pdp = document.querySelector<HTMLElement>('[data-pdp]');
  const form = pdp?.querySelector<HTMLFormElement>('[data-pdp-form]');
  const json = pdp?.querySelector<HTMLScriptElement>('[data-product-json]');
  if (!pdp || !form || !json) return;

  const product = JSON.parse(json.textContent || '{}') as { variants: PVariant[] };
  const variants = product.variants ?? [];
  const ci = Number(pdp.dataset.ci ?? -1);
  const zi = Number(pdp.dataset.zi ?? -1);
  const name = pdp.dataset.name ?? '';

  const idInput = form.querySelector<HTMLInputElement>('input[name="id"]')!;
  const sets = [...pdp.querySelectorAll<HTMLElement>('[data-set]')];
  const count = pdp.querySelector<HTMLElement>('[data-count]');
  const colorName = pdp.querySelector<HTMLElement>('[data-color-name]');
  const priceEl = pdp.querySelector<HTMLElement>('[data-price]');
  const compareEl = pdp.querySelector<HTMLElement>('[data-compare]');
  const buybarColor = document.querySelector<HTMLElement>('[data-buybar-color]');
  const buybarPrice = document.querySelector<HTMLElement>('[data-buybar-price]');
  const sizeField = pdp.querySelector<HTMLElement>('[data-size-field]');
  const sizeError = pdp.querySelector<HTMLElement>('[data-size-error]');
  const buy = pdp.querySelector<HTMLAnchorElement>('[data-pdp-buy]');
  const addBtn = pdp.querySelector<HTMLButtonElement>('[data-pdp-add]');
  const buyLabels = buy ? [...buy.querySelectorAll<HTMLElement>('[data-buy-label]')] : [];
  // Solo los enlaces de ESTA prenda (no los de las tarjetas relacionadas).
  const waLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-wa-product]')].filter((a) => !a.closest('[data-card]'));
  const colorInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="mw-color"]')];
  const sizeInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="mw-size"]')];

  const activeSet = () => sets.find((s) => s.classList.contains('is-active'));
  const selectedColor = () => colorInputs.find((i) => i.checked) ?? colorInputs[0] ?? null;
  const selectedSize = () => sizeInputs.find((i) => i.checked)?.value ?? null;
  const colorValue = () => selectedColor()?.value ?? null;

  const matches = (v: PVariant, color: string | null, size: string | null) =>
    (ci < 0 || color === null || v.options[ci] === color) && (zi < 0 || size === null || v.options[zi] === size);
  const resolve = (color: string | null, size: string | null) => {
    const list = variants.filter((v) => matches(v, color, size));
    return list.find((v) => v.available) ?? list[0] ?? null;
  };
  const current = () => resolve(colorValue(), selectedSize());
  const colorSoldOut = () => !variants.some((v) => matches(v, colorValue(), null) && v.available);

  // Releasit oculta "Agregar" cuando la tienda lo tiene configurado así.
  if (addBtn && hideAdd()) addBtn.hidden = true;
  if (!codOn() && buy) buyLabels.forEach((l) => (l.textContent = 'Comprar ahora'));

  const updateCount = () => {
    const set = activeSet();
    if (!count || !set) return;
    const shots = set.children.length;
    const i = Math.round(set.scrollLeft / Math.max(1, set.clientWidth)) + 1;
    count.textContent = `${Math.min(i, shots)} / ${shots}`;
    count.hidden = shots < 2;
  };

  const setError = (msg: string | null) => {
    if (sizeError) {
      sizeError.hidden = !msg;
      if (msg) sizeError.textContent = msg;
    }
    sizeField?.classList.toggle('opt--invalid', Boolean(msg));
  };

  const paintSizes = () => {
    const color = colorValue();
    for (const input of sizeInputs) {
      const ok = variants.some((v) => matches(v, color, input.value) && v.available);
      input.disabled = !ok;
      input.closest('.opt__item')?.classList.toggle('is-out', !ok);
      const sr = input.closest('.opt__item')?.querySelector<HTMLElement>('[data-out]');
      if (sr) sr.hidden = ok;
      if (!ok && input.checked) input.checked = false;
    }
  };

  const updateVariant = (updateUrl: boolean) => {
    const v = current();
    if (!v) return;
    idInput.value = String(v.id);
    if (priceEl) priceEl.textContent = money(v.price);
    const before = v.compare_at_price ?? 0;
    if (compareEl) {
      compareEl.textContent = before > v.price ? money(before) : '';
      compareEl.hidden = !(before > v.price);
    }
    if (buybarPrice) buybarPrice.textContent = money(v.price);
    const soldOut = colorSoldOut();
    buy?.classList.toggle('is-disabled', soldOut);
    buy?.setAttribute('aria-disabled', String(soldOut));
    if (addBtn) addBtn.disabled = soldOut;
    buyLabels.forEach((l) => (l.textContent = soldOut ? 'Agotado' : codOn() ? cfg.buy : 'Comprar ahora'));
    const input = selectedColor();
    const wa = waLink(productMessage(name, input?.dataset.label ?? null, v.price));
    waLinks.forEach((a) => (a.href = wa));
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', String(v.id));
      history.replaceState(history.state, '', url);
    }
  };

  const showColor = (input: HTMLInputElement, updateUrl = true) => {
    const key = input.dataset.key;
    if (sets.length > 1) {
      sets.forEach((s) => {
        const on = s.dataset.set === key;
        s.classList.toggle('is-active', on);
        if (on) s.scrollLeft = 0;
      });
    }
    if (colorName) colorName.textContent = input.dataset.label ?? '';
    if (buybarColor) buybarColor.textContent = input.dataset.label ?? '';
    paintSizes();
    updateVariant(updateUrl);
    updateCount();
  };

  /** Talla elegida y disponible; si no, muestra el aviso. */
  const validate = (scroll: boolean) => {
    if (colorSoldOut()) {
      setError('Este color está agotado.');
      return false;
    }
    if (sizeInputs.length && !selectedSize()) {
      setError('Elige una talla.');
      if (scroll) sizeField?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      sizeInputs.find((i) => !i.disabled)?.focus({ preventScroll: true });
      return false;
    }
    const v = current();
    if (!v || !v.available) {
      setError('Esta talla está agotada.');
      return false;
    }
    setError(null);
    return true;
  };

  const isBound = () => Boolean(buy && buy.id === RSI_ID);

  /** Sin Releasit: se agrega y se va al checkout de Shopify. */
  const directCheckout = async () => {
    const v = current();
    if (!v) return;
    buy?.setAttribute('aria-busy', 'true');
    try {
      await cart.add(v.id, 1);
      window.location.href = `${cfg.root}checkout`;
    } catch {
      buy?.removeAttribute('aria-busy');
      toast('No se pudo iniciar la compra. Intenta de nuevo.', false);
    }
  };

  /** Releasit aún cargando: se espera a que convierta el botón y se repite el clic. */
  let waiting = false;
  const waitForCod = () => {
    if (waiting || !buy) return;
    waiting = true;
    buy.setAttribute('aria-busy', 'true');
    const started = Date.now();
    const tick = () => {
      if (isBound()) {
        waiting = false;
        buy.removeAttribute('aria-busy');
        buy.click();
      } else if (Date.now() - started > 6000) {
        waiting = false;
        buy.removeAttribute('aria-busy');
        directCheckout();
      } else window.setTimeout(tick, 150);
    };
    tick();
  };

  // Fase de captura: corre ANTES que el manejador que Releasit pone en el botón.
  pdp.addEventListener(
    'click',
    (e) => {
      const target = (e.target as Element).closest('[data-pdp-buy]');
      if (!target) return;
      if (!validate(false) || buy?.getAttribute('aria-busy') === 'true') {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (isBound()) return; // Releasit abre su formulario con la variante del input name="id"
      e.preventDefault();
      e.stopImmediatePropagation();
      if (codOn() || window._RSI_COD_FORM_SETTINGS) waitForCod();
      else directCheckout();
    },
    true,
  );

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'mw-color') {
      setError(null);
      showColor(t);
    }
    if (t.name === 'mw-size') {
      setError(null);
      updateVariant(true);
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    buy?.click();
  });

  addBtn?.addEventListener('click', () => {
    if (!validate(false)) return;
    const v = current();
    const input = selectedColor();
    if (!v) return;
    addToBag({ id: v.id, name, color: input?.dataset.label ?? null, size: selectedSize() }, 'toast', activeSet()?.querySelector<HTMLImageElement>('img'));
  });

  document.querySelector('[data-pdp-buybar]')?.addEventListener('click', () => {
    if (!validate(true)) return;
    buy?.click();
  });

  sets.forEach((s) => s.addEventListener('scroll', updateCount, { passive: true }));
  paintSizes();
  updateVariant(false);
  updateCount();

  // Llegada desde la vista rápida (?pedir=1): talla elegida y formulario de Releasit abierto.
  const url = new URL(window.location.href);
  if (url.searchParams.has('pedir')) {
    url.searchParams.delete('pedir');
    history.replaceState(history.state, '', url);
    const wanted = pdp.dataset.selectedSize;
    const input = sizeInputs.find((i) => i.value === wanted && !i.disabled);
    if (input) {
      input.checked = true;
      updateVariant(false);
      requestAnimationFrame(() => buy?.click());
    }
  }

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
