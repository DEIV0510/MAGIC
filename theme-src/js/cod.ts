// Releasit (pago contraentrega) con el estilo de la web: la app pinta sus botones con
// estilos en línea (verde, redondeado, con temblor). En este tema se les quitan esos
// estilos al aparecer y el CSS (theme-src/css/shopify.css) les da el diseño propio.
// Solo afecta a ESTE tema: la configuración de la app no se toca.
const SELECTOR = '._rsi-buy-now-button, #_rsi-buy-now-button-overwrite';
const SHAKE = ['_rsi-buy-now-button-shaker', '_rsi-buy-now-button-shaker-enabled'];

// Cada cambio se deshace solo si hace falta: tocar class/style sin cambios también
// dispara el observador y lo haría girar en círculo.
function strip(el: HTMLElement) {
  if (el.hasAttribute('style')) el.removeAttribute('style');
  for (const c of SHAKE) if (el.classList.contains(c)) el.classList.remove(c);
}

const watched = new WeakSet<HTMLElement>();
const attrs = new MutationObserver((records) => {
  for (const r of records) strip(r.target as HTMLElement);
});

function clean(el: HTMLElement) {
  strip(el);
  if (watched.has(el)) return;
  watched.add(el);
  attrs.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
}

export function initCod() {
  const sweep = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach(clean);
  sweep();
  new MutationObserver((records) => {
    if (records.some((r) => r.addedNodes.length)) sweep();
  }).observe(document.body, { childList: true, subtree: true });
}
