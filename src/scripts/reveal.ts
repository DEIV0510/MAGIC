// Revelados al entrar en pantalla. Se observa el contenedor (nunca el elemento
// recortado con clip-path, que Chrome mide con área cero).
export function initReveal() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (!els.length) return;
  const show = (el: Element) => el.classList.add('is-in');

  if (!('IntersectionObserver' in window)) {
    els.forEach(show);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // También si ya quedó por encima (saltos con ancla, scroll rápido).
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
          show(e.target);
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}
