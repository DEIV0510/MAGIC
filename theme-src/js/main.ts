// Entrada única del tema. Lo primero: cancelar la red de seguridad del <head>
// (si este archivo no llega, a los 7 s todo el contenido se muestra igual).
import { initHeader } from './header';
import { initDialogs } from './dialogs';
import { initBag } from './bag';
import { initQuick } from './quick';
import { initCards } from './cards';
import { initReveal } from './reveal';
import { initProgress } from './progress';
import { initFloat } from './float';
import { initSearch } from './search';
import { initVideos } from './video';
import { initTestimonials } from './testimonial';
import { initViewTransitions } from './vt';
import { initHome } from './home';
import { initPdp } from './pdp';
import { initCod } from './cod';
import { cfg, designMode, finePointer, motionOK, onIdle, page } from './env';

window.clearTimeout(window.__magicFallback);

initHeader();
initDialogs();
initBag();
initQuick();
initCards();
initSearch();
initFloat();
initVideos();
initTestimonials();
initViewTransitions();
initReveal();
initProgress();
initCod();

if (page === 'home') initHome();
if (page === 'product') initPdp();

if (motionOK && finePointer && !designMode) onIdle(() => import(/* @vite-ignore */ cfg.smooth).then((m) => m.initSmooth()));

// Editor de temas: al recargar una sección se vuelven a iniciar sus partes.
document.addEventListener('shopify:section:load', (e) => {
  const scope = e.target as HTMLElement;
  initReveal(scope);
  initProgress(scope);
  initVideos(scope);
  initTestimonials(scope);
  initHome(scope);
});
