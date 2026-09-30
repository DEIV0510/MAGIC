// Botón flotante de WhatsApp: aparece al dejar atrás la portada y se retira
// cuando el propio CTA de contacto está en pantalla (no se duplica).
import { rafThrottle } from './env';

export function initFloat() {
  const btn = document.querySelector<HTMLElement>('[data-wa-float]');
  if (!btn) return;
  const contact = document.getElementById('contacto');
  let contactVisible = false;

  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      contactVisible = entries[0].isIntersecting;
      update();
    }).observe(contact);
  }

  function update() {
    const show = window.scrollY > window.innerHeight * 0.6 && !contactVisible;
    btn!.classList.toggle('is-visible', show);
  }

  window.addEventListener('scroll', rafThrottle(update), { passive: true });
  update();
}
