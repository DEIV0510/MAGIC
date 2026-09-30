// Header: transparente sobre la portada, papel al bajar, tinta sobre secciones oscuras.
import { rafThrottle } from './env';

export function initHeader() {
  const hdr = document.querySelector<HTMLElement>('header.hdr');
  if (!hdr) return;
  const initial = hdr.dataset.initial ?? 'paper';

  const update = () => {
    // Se buscan en cada pasada: en el editor de temas las secciones se recargan.
    const stage = document.querySelector<HTMLElement>('[data-hero] .hero__stage');
    const mid = hdr.offsetHeight / 2;
    let surface = 'paper';
    for (const s of document.querySelectorAll<HTMLElement>('section[data-tone="dark"], footer[data-tone="dark"]')) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) {
        surface = 'ink';
        break;
      }
    }
    if (surface !== 'ink' && initial === 'clear' && stage) {
      surface = stage.getBoundingClientRect().bottom > hdr.offsetHeight ? 'clear' : 'paper';
    }
    if (hdr.dataset.surface !== surface) hdr.dataset.surface = surface;
  };

  const schedule = rafThrottle(update);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('shopify:section:load', schedule);
  update();
}
