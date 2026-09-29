// Señales del entorno, leídas una vez.
const root = document.documentElement;

export const motionOK = root.classList.contains('mo');
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const page = root.dataset.page ?? 'page';

export const qs = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => ctx.querySelector<T>(sel);
export const qsa = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => [...ctx.querySelectorAll<T>(sel)];

export const onIdle = (fn: () => void, timeout = 1500) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 600);
};

/** Ejecuta fn como mucho una vez por fotograma. */
export function rafThrottle(fn: () => void) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
}

export const emit = (name: string, detail?: unknown) => document.dispatchEvent(new CustomEvent(name, { detail }));
