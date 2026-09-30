// Motor de scroll: escribe --p (0→1) en los elementos con data-progress.
//   pin   → sección alta con hijo sticky (0 al fijarse, 1 al soltarse)
//   hero  → 0 arriba del todo, 1 cuando el elemento salió por arriba
//   view  → 0 al asomar por abajo, 1 al salir por arriba
//   enter → 0 al asomar, 1 cuando su borde superior llega al 40 % de la pantalla
// Solo se miden los elementos cerca de la pantalla (IntersectionObserver): así no
// se fuerza el layout de secciones fuera de vista (content-visibility: auto).
import { motionOK, rafThrottle } from './env';

type Mode = 'pin' | 'hero' | 'view' | 'enter';
const tracked = new Set<HTMLElement>();
const near = new Set<HTMLElement>();
const last = new WeakMap<HTMLElement, string>();
let vh = window.innerHeight;
let started = false;
let io: IntersectionObserver | null = null;

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

function write(el: HTMLElement) {
  const v = measure(el).toFixed(4);
  if (last.get(el) !== v) {
    last.set(el, v);
    el.style.setProperty('--p', v);
  }
}

function update() {
  for (const el of near) write(el);
}

const schedule = rafThrottle(update);

function observer() {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) near.add(el);
        else if (near.delete(el)) write(el); // última medida: queda en 0 o 1 exactos
      }
      schedule();
    },
    { rootMargin: '50% 0px' },
  );
  return io;
}

export function track(el: HTMLElement, mode?: Mode) {
  if (!motionOK) return;
  if (mode) el.dataset.progress = mode;
  if (tracked.has(el)) {
    schedule();
    return;
  }
  tracked.add(el);
  observer().observe(el);
}

export function untrack(el: HTMLElement) {
  tracked.delete(el);
  near.delete(el);
  io?.unobserve(el);
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
  document.querySelectorAll<HTMLElement>('[data-progress]').forEach((el) => track(el));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refreshProgress, { passive: true });
}
