// Transición entre páginas: la foto tocada viaja hasta la ficha del producto.
// (La página nueva nombra su foto en un script en línea del <head>, ver Base.)
export function initViewTransitions() {
  let picked: HTMLElement | null = null;

  document.addEventListener(
    'pointerdown',
    (e) => {
      const link = (e.target as Element).closest<HTMLAnchorElement>('a[href*="/producto/"]');
      if (!link) {
        picked = null;
        return;
      }
      const card = link.closest<HTMLElement>('[data-card]');
      picked =
        card?.querySelector<HTMLElement>('.card__layer.is-active .card__img--main') ??
        card?.querySelector<HTMLElement>('.tile__frame') ??
        link.querySelector<HTMLElement>('img') ??
        null;
    },
    { capture: true, passive: true },
  );

  window.addEventListener('pageswap', (e: Event) => {
    const ev = e as Event & { viewTransition?: { finished: Promise<void> } | null; activation?: { entry?: { url?: string } } | null };
    if (!ev.viewTransition || !picked) return;
    const url = ev.activation?.entry?.url;
    if (!url || !new URL(url).pathname.startsWith('/producto/')) return;
    const el = picked;
    el.style.viewTransitionName = 'product-hero';
    ev.viewTransition.finished.finally(() => {
      el.style.viewTransitionName = '';
    });
  });
}
