// Entrada única. Lo primero: cancelar la red de seguridad del <head>
// (si este archivo no llega, a los 7 s todo el contenido se muestra igual).
import { initHeader } from './header';
import { initDialogs } from './dialogs';
import { initBag } from './bag';
import { initCards } from './cards';
import { initReveal } from './reveal';
import { initProgress } from './progress';
import { initFloat } from './float';
import { initSearch } from './search';
import { initViewTransitions } from './vt';
import { finePointer, motionOK, onIdle, page } from './env';

window.clearTimeout(window.__magicFallback);

initHeader();
initDialogs();
initBag();
initCards();
initSearch();
initFloat();
initViewTransitions();
initReveal();
initProgress();

if (page === 'home') import('./home').then((m) => m.initHome());
if (page === 'product') import('./pdp').then((m) => m.initPdp());

if (motionOK && finePointer) onIdle(() => import('./smooth').then((m) => m.initSmooth()));
