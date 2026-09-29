// Bolsa, buscador y menú: <dialog> nativo + animación de cierre.
// El bloqueo de scroll lo hace el CSS (html:has(dialog[open])), así que
// siempre se libera al cerrar: nunca queda la página "trabada".
import { emit, motionOK } from './env';

const CLOSE_MS = 460;

function get(id: string) {
  return document.getElementById(id) as HTMLDialogElement | null;
}

function setExpanded(id: string, value: boolean) {
  document.querySelectorAll<HTMLElement>(`[data-open="${id}"]`).forEach((b) => b.setAttribute('aria-expanded', String(value)));
}

export function closeDialog(d: HTMLDialogElement, instant = false) {
  if (!d.open || d.classList.contains('is-closing')) return;
  const finish = () => {
    d.classList.remove('is-closing');
    if (d.open) d.close();
  };
  if (instant || !motionOK) {
    finish();
    return;
  }
  d.classList.add('is-closing');
  window.setTimeout(finish, CLOSE_MS);
}

export function openDialog(id: string) {
  const d = get(id);
  if (!d) return;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((o) => o !== d && closeDialog(o, true));
  if (d.open && !d.classList.contains('is-closing')) return;
  d.classList.remove('is-closing');
  if (!d.open) d.showModal();
  setExpanded(id, true);
  emit('magic:dialog', { id, open: true });
  if (id === 'search') {
    const input = d.querySelector<HTMLInputElement>('[data-search-input]');
    requestAnimationFrame(() => input?.focus());
  }
}

export function initDialogs() {
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>('dialog.sheet')];

  document.addEventListener('click', (e) => {
    const t = e.target as Element;
    const opener = t.closest<HTMLElement>('[data-open]');
    if (opener) {
      e.preventDefault();
      openDialog(opener.dataset.open!);
      return;
    }
    const inDialog = t.closest<HTMLDialogElement>('dialog.sheet');
    if (!inDialog) return;
    if (t.closest('[data-close-nav]')) {
      // Enlace de navegación dentro del diálogo: cerrar al instante y dejar navegar.
      closeDialog(inDialog, true);
      return;
    }
    if (t.closest('[data-close]')) closeDialog(inDialog);
  });

  for (const d of dialogs) {
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeDialog(d);
    });
    d.addEventListener('close', () => {
      setExpanded(d.id, false);
      emit('magic:dialog', { id: d.id, open: false });
    });
  }
}
