// Videos de producto: carga diferida, reproducción solo en pantalla y control manual.
import { motionOK } from './env';

export function initVideos(scope: ParentNode = document) {
  const figures = [...scope.querySelectorAll<HTMLElement>('[data-pvideo]:not([data-ready])')];
  for (const fig of figures) {
    fig.dataset.ready = '';
    const v = fig.querySelector<HTMLVideoElement>('video')!;
    const btn = fig.querySelector<HTMLButtonElement>('[data-pvideo-toggle]')!;
    // iOS y los WebViews miran el atributo, no solo la propiedad.
    v.muted = true;
    v.defaultMuted = true;
    let userPaused = !motionOK;
    let loaded = false;

    const sync = () => {
      const playing = !v.paused;
      fig.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-label', playing ? 'Pausar video' : 'Reproducir video');
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

    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    btn.addEventListener('click', () => {
      if (v.paused) {
        userPaused = false;
        play();
      } else {
        userPaused = true;
        v.pause();
      }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            load();
            if (!userPaused) play();
          } else if (!v.paused) v.pause();
        },
        { rootMargin: '200px 0px' },
      ).observe(fig);
    } else {
      load();
    }
    sync();
  }
}
