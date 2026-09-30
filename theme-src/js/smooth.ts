// Scroll suave con Lenis: solo ratón/trackpad y con movimiento permitido.
// Se detiene mientras hay un diálogo abierto (o el formulario de Releasit).
//
// El bucle de requestAnimationFrame corre SOLO mientras hay desplazamiento: con
// autoRaf, Lenis pide un fotograma tras otro aunque la página esté quieta y eso obliga
// a recalcular en cada fotograma las animaciones infinitas a la vista (flecha del
// lookbook, indicador de scroll): ~125 recálculos por segundo sin mover nada.
import Lenis from 'lenis';

export function initSmooth() {
  const header = document.querySelector<HTMLElement>('header.hdr');
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.11,
    anchors: { offset: -(header?.offsetHeight ?? 64) },
    // Paneles con scroll propio (bolsa, buscador, formulario de pago contraentrega).
    prevent: (node: HTMLElement) => Boolean(node.closest?.('[data-lenis-prevent], ._rsi-modal-container, #_rsi-cod-form-modal')),
  });

  let raf = 0;
  let still = 0;
  const loop = (t: number) => {
    lenis.raf(t);
    still = lenis.isScrolling ? 0 : still + 1;
    // Unos fotogramas más tras detenerse, por si llega otra rueda enseguida.
    raf = still > 20 ? 0 : requestAnimationFrame(loop);
  };
  const kick = () => {
    still = 0;
    if (raf) return;
    // Sin esto, el primer fotograma tras la pausa vería un salto de tiempo enorme y la
    // animación llegaría de golpe al destino.
    (lenis as unknown as { time: number }).time = 0;
    raf = requestAnimationFrame(loop);
  };
  lenis.on('virtual-scroll', kick);
  // Anclas (#contacto, #coleccion): Lenis llama a scrollTo en su propio clic.
  document.addEventListener('click', () => requestAnimationFrame(kick), true);
  window.addEventListener('resize', kick, { passive: true });

  const sync = () => {
    const blocked = document.querySelector('dialog[open]') || document.documentElement.classList.contains('_rsi-cod-form-modal-open') || document.body.classList.contains('_rsi-cod-form-modal-open');
    if (blocked) lenis.stop();
    else {
      lenis.start();
      kick();
    }
  };
  document.addEventListener('magic:dialog', sync);
  // Releasit marca el <body> mientras su formulario está abierto.
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
  kick();
  (window as unknown as { __lenis: Lenis }).__lenis = lenis;
}
