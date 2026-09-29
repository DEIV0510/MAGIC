// Scroll suave con Lenis: solo ratón/trackpad y con movimiento permitido.
// Se detiene mientras hay un diálogo abierto.
import Lenis from 'lenis';

export function initSmooth() {
  const header = document.querySelector<HTMLElement>('header.hdr');
  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.11,
    anchors: { offset: -(header?.offsetHeight ?? 64) },
  });
  document.addEventListener('magic:dialog', (e) => {
    const open = (e as CustomEvent<{ open: boolean }>).detail?.open;
    if (open) lenis.stop();
    else if (!document.querySelector('dialog[open]')) lenis.start();
  });
  (window as unknown as { __lenis: Lenis }).__lenis = lenis;
}
