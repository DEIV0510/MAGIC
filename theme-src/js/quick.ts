// Vista rápida: cualquier botón [data-quick="handle"] abre el diálogo para elegir
// color y talla sin salir de la página. Talla obligatoria si la prenda tiene tallas.
// Con pago contraentrega (Releasit): "Pedir ahora" lleva a la ficha con esa variante
// y el formulario de la app se abre solo. Sin Releasit: agrega a la bolsa.
import { addToBag } from './bag';
import { closeDialog, openDialog } from './dialogs';
import { cfg, codOn, hideAdd, money } from './env';
import { colorAvailable, findItem, findVariant, itemUrl, opt, type ShopColor, type ShopItem } from './shopdata';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

function option(name: string, value: string, label: string, checked: boolean, swatch?: string, out = false) {
  const wrap = document.createElement('label');
  wrap.className = `opt__item${swatch ? ' opt__item--color' : ' opt__item--size'}${out ? ' is-out' : ''}`;
  const input = document.createElement('input');
  input.type = 'radio';
  input.className = 'sr-only';
  input.name = name;
  input.value = value;
  input.checked = checked;
  if (out && !swatch) input.disabled = true;
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
  if (out && !swatch) {
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = ', agotada';
    wrap.append(sr);
  }
  return wrap;
}

export function initQuick() {
  const dialog = document.getElementById('quick') as HTMLDialogElement | null;
  if (!dialog) return;
  const form = dialog.querySelector<HTMLFormElement>('[data-quick-form]')!;
  const img = dialog.querySelector<HTMLImageElement>('[data-quick-img]')!;
  const name = dialog.querySelector<HTMLElement>('[data-quick-name]')!;
  const price = dialog.querySelector<HTMLElement>('[data-quick-price]')!;
  const compare = dialog.querySelector<HTMLElement>('[data-quick-compare]');
  const colorsField = dialog.querySelector<HTMLElement>('[data-quick-colors-field]')!;
  const colorsRow = dialog.querySelector<HTMLElement>('[data-quick-colors]')!;
  const colorName = dialog.querySelector<HTMLElement>('[data-quick-color-name]')!;
  const sizesField = dialog.querySelector<HTMLElement>('[data-quick-sizes-field]')!;
  const sizesRow = dialog.querySelector<HTMLElement>('[data-quick-sizes]')!;
  const error = dialog.querySelector<HTMLElement>('[data-quick-error]')!;
  const link = dialog.querySelector<HTMLAnchorElement>('[data-quick-link]')!;
  const submit = dialog.querySelector<HTMLButtonElement>('[data-quick-submit]')!;
  const labels = [...dialog.querySelectorAll<HTMLElement>('[data-quick-label]')];
  const codNote = dialog.querySelector<HTMLElement>('[data-quick-cod]');
  const addBtn = dialog.querySelector<HTMLButtonElement>('[data-quick-add]');

  let item: ShopItem | null = null;
  let color: ShopColor | null = null;

  const selectedSize = () => form.querySelector<HTMLInputElement>('input[name="quick-size"]:checked')?.value ?? null;

  const setLabel = (text: string) => labels.forEach((l) => (l.textContent = text));

  const refresh = () => {
    if (!item) return;
    const v = findVariant(item, color?.v ?? null, selectedSize());
    const cents = v ? v[5] : item.p;
    const before = v ? v[6] : item.cp;
    price.textContent = money(cents);
    if (compare) {
      compare.textContent = before > cents ? money(before) : '';
      compare.hidden = !(before > cents);
    }
    const soldOut = color ? !colorAvailable(item, color.v) : !item.a;
    submit.disabled = soldOut;
    if (addBtn) addBtn.disabled = soldOut;
    setLabel(soldOut ? 'Agotado' : codOn() ? cfg.buy : 'Agregar a la bolsa');
  };

  const paintSizes = () => {
    if (!item) return;
    const keep = selectedSize();
    sizesRow.replaceChildren(
      ...item.z.map((z) => {
        const available = item!.v.some((v) => opt(v, item!.zi) === z && (item!.ci < 0 || opt(v, item!.ci) === color?.v) && v[4]);
        return option('quick-size', z, z, keep === z && available, undefined, !available);
      }),
    );
  };

  const showColor = () => {
    if (!item) return;
    img.src = color?.i || BLANK;
    img.dataset.bg = color?.b ?? 'photo';
    colorName.textContent = color?.l ?? '';
    link.href = itemUrl(item, color);
    paintSizes();
    refresh();
  };

  const setInvalid = (on: boolean) => {
    error.hidden = !on;
    sizesField.classList.toggle('opt--invalid', on);
  };

  function open(handle: string, colorValue?: string) {
    item = findItem(handle) ?? null;
    if (!item) return;
    color = item.c.find((c) => c.v === colorValue) ?? item.c.find((c) => colorAvailable(item!, c.v)) ?? item.c[0] ?? null;
    name.textContent = item.n;
    colorsField.hidden = item.c.length < 2;
    colorsRow.replaceChildren(...item.c.map((c) => option('quick-color', c.v, c.l, c.v === color?.v, c.sw)));
    sizesField.hidden = item.zi < 0;
    if (codNote) codNote.hidden = !codOn();
    if (addBtn) addBtn.hidden = !codOn() || hideAdd();
    setInvalid(false);
    showColor();
    openDialog('quick');
    requestAnimationFrame(() => {
      const first = sizesRow.querySelector<HTMLInputElement>('input:not(:disabled)') ?? form.querySelector<HTMLElement>('[data-quick-submit]');
      first?.focus();
    });
  }

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-quick]');
    if (!btn) return;
    e.preventDefault();
    open(btn.dataset.quick!, btn.dataset.quickColor);
  });

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'quick-color' && item) {
      color = item.c.find((c) => c.v === t.value) ?? color;
      showColor();
    }
    if (t.name === 'quick-size') {
      setInvalid(false);
      refresh();
    }
  });

  /** Valida la talla y devuelve la variante elegida (o null si falta la talla). */
  const chosen = () => {
    if (!item) return null;
    const size = selectedSize();
    if (item.zi >= 0 && !size) {
      setInvalid(true);
      sizesRow.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
      return null;
    }
    const v = findVariant(item, color?.v ?? null, size);
    return v && v[4] ? { v, size } : null;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pick = chosen();
    if (!item || !pick) return;
    if (codOn()) {
      // A la ficha con la variante exacta: allí Releasit abre su formulario.
      submit.setAttribute('aria-busy', 'true');
      window.location.href = `${item.u}?variant=${pick.v[0]}&pedir=1`;
      return;
    }
    const ok = await addToBag({ id: pick.v[0], name: item.n, color: color?.l ?? null, size: pick.size }, 'open');
    if (ok) closeDialog(dialog, true);
  });

  addBtn?.addEventListener('click', async () => {
    const pick = chosen();
    if (!item || !pick) return;
    const ok = await addToBag({ id: pick.v[0], name: item.n, color: color?.l ?? null, size: pick.size }, 'toast');
    if (ok) closeDialog(dialog, true);
  });
}
