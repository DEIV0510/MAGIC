// Revelados al entrar en pantalla. Se observa el contenedor (nunca el elemento
// recortado con clip-path, que Chrome mide con área cero).
import { designMode } from './env';

let io: IntersectionObserver | null = null;
const show = (el: Element) => el.classList.add('is-in');

export function initReveal(scope: ParentNode = document) {
  const els = [...scope.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')];
  if (!els.length) return;

  // En el editor de temas todo se ve de inmediato (las secciones se recargan a cada cambio).
  if (designMode || !('IntersectionObserver' in window)) {
    els.forEach(show);
    return;
  }

  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // También si ya quedó por encima (saltos con ancla, scroll rápido).
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
          show(e.target);
          io!.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
  );
  els.forEach((el) => io!.observe(el));
}
