// Tarjetas: cambio de color (foto, enlaces, WhatsApp y color de la vista rápida)
// y una reacción leve de la foto al cursor (solo puntero fino).
import { finePointer, motionOK } from './env';

function selectColor(card: HTMLElement, sw: HTMLElement) {
  const id = sw.dataset.swatch!;
  card.dataset.color = id;
  card.querySelectorAll<HTMLElement>('.swatch').forEach((s) => s.setAttribute('aria-pressed', String(s === sw)));
  card.querySelectorAll<HTMLElement>('[data-layer]').forEach((l) => l.classList.toggle('is-active', l.dataset.layer === id));
  // La vista rápida abre con este color; enlaces y WhatsApp apuntan a él.
  card.querySelectorAll<HTMLElement>('[data-quick]').forEach((b) => (b.dataset.quickColor = id));
  if (sw.dataset.href) card.querySelectorAll<HTMLAnchorElement>('[data-card-link]').forEach((a) => (a.href = sw.dataset.href!));
  const wa = card.querySelector<HTMLAnchorElement>('[data-wa-product]');
  if (wa && sw.dataset.wa) wa.href = sw.dataset.wa;
}

export function initCards() {
  document.addEventListener('click', (e) => {
    const sw = (e.target as Element).closest<HTMLElement>('.swatch[data-swatch]');
    if (!sw) return;
    const card = sw.closest<HTMLElement>('[data-card]');
    if (card) selectColor(card, sw);
  });

  if (!finePointer || !motionOK) return;

  let frame: HTMLElement | null = null;
  let queued = false;
  let mx = 0;
  let my = 0;

  const apply = () => {
    queued = false;
    if (!frame) return;
    frame.style.setProperty('--mx', mx.toFixed(3));
    frame.style.setProperty('--my', my.toFixed(3));
  };

  document.addEventListener(
    'pointermove',
    (e) => {
      const f = (e.target as Element).closest<HTMLElement>('.card__frame');
      if (frame && f !== frame) {
        frame.style.setProperty('--mx', '0');
        frame.style.setProperty('--my', '0');
      }
      frame = f;
      if (!f) return;
      const r = f.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * -2;
      my = ((e.clientY - r.top) / r.height - 0.5) * -2;
      if (!queued) {
        queued = true;
        requestAnimationFrame(apply);
      }
    },
    { passive: true },
  );
}
