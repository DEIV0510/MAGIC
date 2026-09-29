import { rafThrottle } from './env';

// Ficha de producto: selector de color (radio accesible), galería deslizable
// con contador, color desde ?color= y barra de compra fija en móvil.
export function initPdp() {
  const pdp = document.querySelector<HTMLElement>('[data-pdp]');
  if (!pdp) return;
  const picks = [...pdp.querySelectorAll<HTMLButtonElement>('[data-color-pick]')];
  const sets = [...pdp.querySelectorAll<HTMLElement>('[data-set]')];
  const count = pdp.querySelector<HTMLElement>('[data-count]');
  const colorName = pdp.querySelector<HTMLElement>('[data-color-name]');
  const buyButtons = [...document.querySelectorAll<HTMLElement>('[data-add]')].filter((b) => b.dataset.slug === pdp.dataset.slug);
  // Solo los enlaces de ESTA prenda (no los de las tarjetas relacionadas).
  const waLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-wa-product]')].filter((a) => !a.closest('[data-card]'));
  const buybarColor = document.querySelector<HTMLElement>('[data-buybar-color]');

  const activeSet = () => sets.find((s) => s.classList.contains('is-active'));

  const updateCount = () => {
    const set = activeSet();
    if (!count || !set) return;
    const shots = set.children.length;
    const i = Math.round(set.scrollLeft / Math.max(1, set.clientWidth)) + 1;
    count.textContent = `${Math.min(i, shots)} / ${shots}`;
    count.hidden = shots < 2;
  };

  const select = (btn: HTMLButtonElement, updateUrl = true) => {
    const id = btn.dataset.colorPick!;
    picks.forEach((p) => {
      const on = p === btn;
      p.setAttribute('aria-checked', String(on));
      p.tabIndex = on ? 0 : -1;
    });
    sets.forEach((s) => {
      const on = s.dataset.set === id;
      s.classList.toggle('is-active', on);
      if (on) s.scrollLeft = 0;
    });
    if (colorName) colorName.textContent = btn.dataset.label ?? '';
    if (buybarColor) buybarColor.textContent = btn.dataset.label ?? '';
    for (const b of buyButtons) {
      b.dataset.color = id;
      b.dataset.colorLabel = btn.dataset.label ?? '';
      b.dataset.image = btn.dataset.image ?? '';
      b.dataset.bg = btn.dataset.bg ?? '';
      b.dataset.variant = btn.dataset.variant ?? '';
    }
    if (btn.dataset.wa) waLinks.forEach((a) => (a.href = btn.dataset.wa!));
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (picks[0] === btn) url.searchParams.delete('color');
      else url.searchParams.set('color', id);
      history.replaceState(history.state, '', url);
    }
    updateCount();
  };

  picks.forEach((btn, i) => {
    btn.addEventListener('click', () => select(btn));
    btn.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const next = picks[(i + dir + picks.length) % picks.length];
      next.focus();
      select(next);
    });
  });

  const wanted = new URL(window.location.href).searchParams.get('color');
  const initial = picks.find((p) => p.dataset.colorPick === wanted);
  if (initial) select(initial, false);

  sets.forEach((s) => s.addEventListener('scroll', updateCount, { passive: true }));
  updateCount();

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
