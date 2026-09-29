// Motor de scroll: escribe --p (0→1) en los elementos con data-progress.
//   pin   → sección alta con hijo sticky (0 al fijarse, 1 al soltarse)
//   hero  → 0 arriba del todo, 1 cuando el elemento salió por arriba
//   view  → 0 al asomar por abajo, 1 al salir por arriba
//   enter → 0 al asomar, 1 cuando su borde superior llega al 40 % de la pantalla
// Solo se usan transform/opacity en CSS; aquí no se toca el layout.
import { motionOK, rafThrottle } from './env';

type Mode = 'pin' | 'hero' | 'view' | 'enter';
const tracked = new Set<HTMLElement>();
const last = new WeakMap<HTMLElement, string>();
let vh = window.innerHeight;
let started = false;

const clamp = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function measure(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  switch (el.dataset.progress as Mode) {
    case 'pin':
      return clamp(-r.top / Math.max(1, r.height - vh));
    case 'hero':
      return clamp(-r.top / Math.max(1, r.height));
    case 'enter':
      return clamp((vh - r.top) / (vh * 0.6));
    case 'view':
    default:
      return clamp((vh - r.top) / (vh + r.height));
  }
}

function update() {
  for (const el of tracked) {
    const v = measure(el).toFixed(4);
    if (last.get(el) !== v) {
      last.set(el, v);
      el.style.setProperty('--p', v);
    }
  }
}

const schedule = rafThrottle(update);

export function track(el: HTMLElement, mode?: Mode) {
  if (!motionOK) return;
  if (mode) el.dataset.progress = mode;
  tracked.add(el);
  schedule();
}

export function untrack(el: HTMLElement) {
  tracked.delete(el);
  last.delete(el);
  el.style.removeProperty('--p');
}

export function refreshProgress() {
  vh = window.innerHeight;
  schedule();
}

export function initProgress() {
  if (!motionOK || started) return;
  started = true;
  document.querySelectorAll<HTMLElement>('[data-progress]').forEach((el) => tracked.add(el));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refreshProgress, { passive: true });
  update();
}
