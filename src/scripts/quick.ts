// Vista rápida: cualquier botón [data-quick="slug"] abre el diálogo para elegir
// color y talla sin salir de la página. Talla obligatoria si la prenda tiene tallas.
import { addToBag } from './bag';
import { closeDialog, openDialog } from './dialogs';
import { findItem, itemUrl, money, type ShopColor, type ShopItem } from './shopdata';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

function option(name: string, value: string, label: string, checked: boolean, swatch?: string) {
  const wrap = document.createElement('label');
  wrap.className = `opt__item${swatch ? ' opt__item--color' : ' opt__item--size'}`;
  const input = document.createElement('input');
  input.type = 'radio';
  input.className = 'sr-only';
  input.name = name;
  input.value = value;
  input.checked = checked;
  wrap.append(input);
  if (swatch) {
    const sw = document.createElement('span');
    sw.className = 'opt__swatch';
    sw.style.setProperty('--sw', swatch);
    sw.setAttribute('aria-hidden', 'true');
    wrap.append(sw);
  }
  const text = document.createElement('span');
  text.textContent = label;
  wrap.append(text);
  return wrap;
}

export function initQuick() {
  const dialog = document.getElementById('quick') as HTMLDialogElement | null;
  if (!dialog) return;
  const form = dialog.querySelector<HTMLFormElement>('[data-quick-form]')!;
  const img = dialog.querySelector<HTMLImageElement>('[data-quick-img]')!;
  const name = dialog.querySelector<HTMLElement>('[data-quick-name]')!;
  const price = dialog.querySelector<HTMLElement>('[data-quick-price]')!;
  const ship = dialog.querySelector<HTMLElement>('[data-quick-ship]')!;
  const colorsField = dialog.querySelector<HTMLElement>('[data-quick-colors-field]')!;
  const colorsRow = dialog.querySelector<HTMLElement>('[data-quick-colors]')!;
  const colorName = dialog.querySelector<HTMLElement>('[data-quick-color-name]')!;
  const sizesField = dialog.querySelector<HTMLElement>('[data-quick-sizes-field]')!;
  const sizesRow = dialog.querySelector<HTMLElement>('[data-quick-sizes]')!;
  const error = dialog.querySelector<HTMLElement>('[data-quick-error]')!;
  const noSize = dialog.querySelector<HTMLElement>('[data-quick-nosize]')!;
  const link = dialog.querySelector<HTMLAnchorElement>('[data-quick-link]')!;

  let item: ShopItem | null = null;
  let color: ShopColor | null = null;
  let intent: 'open' | 'toast' = 'open';

  const showColor = () => {
    if (!item || !color) return;
    img.src = color.i || BLANK;
    img.dataset.bg = color.b;
    colorName.textContent = color.l;
    link.href = itemUrl(item, color);
  };

  const setInvalid = (on: boolean) => {
    error.hidden = !on;
    sizesField.classList.toggle('opt--invalid', on);
  };

  function open(slug: string, colorId?: string, mode: 'open' | 'toast' = 'open') {
    item = findItem(slug) ?? null;
    if (!item) return;
    intent = mode;
    color = item.c.find((c) => c.id === colorId) ?? item.c[0] ?? null;
    name.textContent = item.n;
    price.textContent = item.p ? money(item.p) : 'Precio por WhatsApp';
    ship.hidden = !item.p;
    colorsField.hidden = item.c.length < 2;
    colorsRow.replaceChildren(...item.c.map((c) => option('quick-color', c.id, c.l, c.id === color?.id, c.sw)));
    sizesField.hidden = !item.z;
    noSize.hidden = Boolean(item.z);
    sizesRow.replaceChildren(...(item.z ?? []).map((z) => option('quick-size', z, z, false)));
    setInvalid(false);
    showColor();
    openDialog('quick');
    requestAnimationFrame(() => {
      const first = sizesRow.querySelector<HTMLInputElement>('input') ?? form.querySelector<HTMLElement>('[data-quick-submit]');
      first?.focus();
    });
  }

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-quick]');
    if (!btn) return;
    e.preventDefault();
    open(btn.dataset.quick!, btn.dataset.quickColor, btn.dataset.quickIntent === 'add' ? 'toast' : 'open');
  });

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'quick-color' && item) {
      color = item.c.find((c) => c.id === t.value) ?? color;
      showColor();
    }
    if (t.name === 'quick-size') setInvalid(false);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!item) return;
    const size = form.querySelector<HTMLInputElement>('input[name="quick-size"]:checked')?.value ?? null;
    if (item.z && !size) {
      setInvalid(true);
      sizesRow.querySelector<HTMLInputElement>('input')?.focus();
      return;
    }
    addToBag(
      { slug: item.s, name: item.n, colorId: color?.id ?? null, colorLabel: color?.l ?? null, size, image: color?.i ?? null, price: item.p, bg: color?.b ?? null },
      intent,
    );
    closeDialog(dialog, true);
  });
}
