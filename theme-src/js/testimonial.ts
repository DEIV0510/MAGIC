// Testimonio en video: arranca sin sonido al verse (con subtítulos) y «Activar sonido» lo
// reinicia desde el principio con audio. Con sonido no se repite: al terminar vuelve al bucle
// mudo. Fuera de pantalla se pausa. Con movimiento reducido no arranca solo.
import { motionOK } from './env';

type Cue = { a: number; b: number; t: string };

/** «inicio-fin | texto» por línea, en segundos (acepta coma decimal). */
function parseCues(raw: string): Cue[] {
  const cues: Cue[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([\d.,]+)\s*-\s*([\d.,]+)\s*\|\s*(.+?)\s*$/);
    if (!m) continue;
    const a = parseFloat(m[1].replace(',', '.'));
    const b = parseFloat(m[2].replace(',', '.'));
    if (b > a) cues.push({ a, b, t: m[3] });
  }
  return cues;
}

export function initTestimonials(scope: ParentNode = document) {
  const figures = [...scope.querySelectorAll<HTMLElement>('[data-tvideo]:not([data-ready])')];
  for (const fig of figures) {
    fig.dataset.ready = '';
    const v = fig.querySelector<HTMLVideoElement>('video')!;
    const toggle = fig.querySelector<HTMLButtonElement>('[data-tvideo-toggle]')!;
    const sound = fig.querySelector<HTMLButtonElement>('[data-tvideo-sound]')!;
    const soundLabel = sound.querySelector<HTMLElement>('[data-tvideo-sound-label]')!;
    const cc = fig.querySelector<HTMLElement>('[data-tvideo-cc]')!;
    const cues = parseCues(fig.dataset.captions ?? '');

    // iOS y los WebViews miran el atributo, no solo la propiedad.
    v.muted = true;
    v.defaultMuted = true;
    let userPaused = !motionOK;
    let loaded = false;
    let inView = false;
    let shown = -1;

    const sync = () => {
      const playing = !v.paused;
      fig.classList.toggle('is-playing', playing);
      fig.classList.toggle('is-sound', !v.muted);
      toggle.setAttribute('aria-label', playing ? 'Pausar video' : 'Reproducir video');
      sound.setAttribute('aria-pressed', String(!v.muted));
      soundLabel.textContent = (v.muted ? sound.dataset.on : sound.dataset.off) || '';
    };
    const paintCue = () => {
      const t = v.currentTime;
      // Quieto en el segundo 0 (póster): sin subtítulo encima.
      const i = v.paused && t === 0 ? -1 : cues.findIndex((c) => t >= c.a && t < c.b);
      if (i === shown) return;
      shown = i;
      cc.replaceChildren();
      if (i < 0) {
        cc.hidden = true;
        return;
      }
      const line = document.createElement('span');
      line.textContent = cues[i].t;
      cc.append(line);
      cc.hidden = false;
    };
    const load = () => {
      if (loaded) return;
      loaded = true;
      v.src = v.dataset.src!;
      v.preload = 'auto';
    };
    const play = () => {
      load();
      v.play().catch(() => {
        // Autoplay bloqueado: queda el botón para el primer toque.
        userPaused = true;
        sync();
      });
    };
    const muteLoop = () => {
      v.muted = true;
      v.loop = true;
    };

    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    v.addEventListener('volumechange', sync);
    v.addEventListener('timeupdate', paintCue);
    v.addEventListener('seeked', paintCue);
    v.addEventListener('playing', paintCue);
    // Solo llega aquí con sonido (sin loop): vuelve al bucle mudo.
    v.addEventListener('ended', () => {
      muteLoop();
      v.currentTime = 0;
      if (inView && !userPaused) play();
      sync();
    });

    toggle.addEventListener('click', () => {
      if (v.paused) {
        userPaused = false;
        play();
      } else {
        userPaused = true;
        v.pause();
      }
    });
    sound.addEventListener('click', () => {
      if (v.muted) {
        // Con sonido desde el principio: se escucha el testimonio completo.
        v.muted = false;
        v.loop = false;
        userPaused = false;
        if (loaded) v.currentTime = 0;
        play();
      } else {
        muteLoop();
      }
      sync();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([e]) => {
          inView = e.isIntersecting;
          if (inView) {
            load();
            if (!userPaused) play();
          } else if (!v.paused) v.pause();
        },
        { threshold: 0.35 },
      ).observe(fig);
    } else {
      load();
    }
    sync();
  }
}
