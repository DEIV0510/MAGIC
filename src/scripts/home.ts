// Portada: carga, portada móvil, lookbook fijado, producto destacado y categorías.
import { finePointer, motionOK } from './env';
import { track, untrack, refreshProgress } from './progress';

const desktop = matchMedia('(min-width: 768px)');

function initLoader() {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!loader) return;
  const root = document.documentElement;
  if (!root.classList.contains('intro')) {
    loader.remove();
    return;
  }
  const done = () => {
    loader.remove();
    root.classList.remove('intro');
  };
  loader.addEventListener('animationend', (e) => {
    if (e.target === loader) done();
  });
  // Pestaña en segundo plano o animación pausada: nunca se queda puesta.
  window.setTimeout(done, 3200);
}

/** Móvil: una foto a la vez (azul → rojo → negro). Tocar un color detiene el ciclo. */
function initHeroSlides() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const panels = [...hero.querySelectorAll<HTMLElement>('[data-hero-panel]')];
  const dots = [...hero.querySelectorAll<HTMLButtonElement>('[data-hero-dot]')];
  const now = hero.querySelector<HTMLElement>('[data-hero-now]');
  const name = now?.textContent?.split(' — ')[0] ?? '';
  let index = 0;
  let timer = 0;
  let inView = true;
  let stopped = !motionOK;

  const show = (i: number) => {
    index = (i + panels.length) % panels.length;
    panels.forEach((p, k) => p.classList.toggle('is-active', k === index));
    dots.forEach((d, k) => d.setAttribute('aria-pressed', String(k === index)));
    if (now) now.textContent = `${name} — ${panels[index].dataset.label}`;
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (stopped || desktop.matches || !inView || document.hidden) return;
    timer = window.setTimeout(() => {
      show(index + 1);
      schedule();
    }, 4200);
  };

  dots.forEach((d, k) =>
    d.addEventListener('click', () => {
      stopped = true;
      window.clearTimeout(timer);
      show(k);
    }),
  );

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      schedule();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', schedule);
  desktop.addEventListener('change', () => {
    if (desktop.matches) panels.forEach((p) => p.classList.remove('is-active'));
    else show(index);
    schedule();
  });

  const delay = document.documentElement.classList.contains('intro') ? 2400 : 900;
  window.setTimeout(schedule, delay);
}

/** Escritorio: el scroll vertical desplaza la tira en horizontal. */
function initLookbook() {
  const section = document.querySelector<HTMLElement>('[data-lookbook]');
  const trackEl = section?.querySelector<HTMLElement>('[data-lookbook-track]');
  if (!section || !trackEl) return;
  const hint = section.querySelector<HTMLElement>('[data-hint-touch]');

  const measure = () => {
    // Borde derecho real del último panel + su margen (scrollWidth no cuenta el
    // padding final y innerWidth incluye la barra de scroll).
    const last = trackEl.lastElementChild as HTMLElement | null;
    const padR = parseFloat(getComputedStyle(trackEl).paddingRight) || 0;
    const end = last ? last.offsetLeft + last.offsetWidth + padR : trackEl.scrollWidth;
    const dist = Math.max(0, Math.ceil(end - document.documentElement.clientWidth));
    section.style.setProperty('--dist', `${dist}px`);
    section.style.setProperty('--lb-h', `${dist + window.innerHeight}px`);
    refreshProgress();
  };

  let ro: ResizeObserver | null = null;
  const apply = () => {
    const pin = motionOK && desktop.matches;
    section.classList.toggle('is-pinned', pin);
    if (hint) hint.textContent = pin ? 'Sigue bajando' : 'Desliza';
    if (pin) {
      track(section, 'pin');
      measure();
      ro ??= new ResizeObserver(measure);
      ro.observe(trackEl);
    } else {
      ro?.disconnect();
      untrack(section);
      section.style.removeProperty('--dist');
      section.style.removeProperty('--lb-h');
    }
  };
  apply();
  desktop.addEventListener('change', apply);
  window.addEventListener('resize', () => section.classList.contains('is-pinned') && measure(), { passive: true });
}

/** Producto destacado: fijado en escritorio; en móvil avanza con el scroll normal. */
function initFeature() {
  const feature = document.querySelector<HTMLElement>('[data-feature]');
  if (!feature || !motionOK) return;
  const apply = () => {
    const pin = desktop.matches;
    feature.classList.toggle('is-pinned', pin);
    track(feature, pin ? 'pin' : 'view');
  };
  apply();
  desktop.addEventListener('change', apply);
}

/** Categorías: la foto sigue al cursor (solo ratón). */
function initCategoryFloat() {
  const cats = document.querySelector<HTMLElement>('[data-cats]');
  const float = cats?.querySelector<HTMLElement>('[data-cats-float]');
  if (!cats || !float || !finePointer || !motionOK) return;
  cats.classList.add('has-float');
  const list = cats.querySelector<HTMLElement>('.cats__list')!;
  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let raf = 0;
  let hovering = false;

  const loop = () => {
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    float.style.setProperty('--fx', `${x.toFixed(1)}px`);
    float.style.setProperty('--fy', `${y.toFixed(1)}px`);
    raf = hovering || Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
  };

  const target = (e: PointerEvent) => {
    const r = cats.getBoundingClientRect();
    const w = float.offsetWidth;
    const h = float.offsetHeight;
    tx = Math.min(e.clientX - r.left + 28, r.width - w - 8);
    ty = e.clientY - r.top - h / 2;
  };

  list.addEventListener('pointerenter', (e) => {
    target(e);
    x = tx;
    y = ty;
    hovering = true;
    cats.classList.add('is-hovering');
    if (!raf) raf = requestAnimationFrame(loop);
  });
  list.addEventListener('pointermove', (e) => {
    target(e);
    const cat = (e.target as Element).closest<HTMLElement>('[data-cat]');
    if (cat) {
      float.querySelectorAll<HTMLElement>('[data-float]').forEach((s) => s.classList.toggle('is-on', s.dataset.float === cat.dataset.cat));
    }
    if (!raf) raf = requestAnimationFrame(loop);
  });
  list.addEventListener('pointerleave', () => {
    hovering = false;
    cats.classList.remove('is-hovering');
  });
}

function initPiecesParallax() {
  if (!motionOK) return;
  document.querySelectorAll<HTMLElement>('.pieces__grid .piece--2, .pieces__grid .piece--6').forEach((el) => track(el, 'view'));
}

export function initHome() {
  initLoader();
  initHeroSlides();
  initLookbook();
  initFeature();
  initCategoryFloat();
  initPiecesParallax();
}
