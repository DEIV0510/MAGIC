// Señales del entorno, leídas una vez. MW = configuración que imprime layout/theme.liquid.
export interface MWConfig {
  root: string;
  cart: string;
  wa: string;
  brand: string;
  smooth: string;
  ship: string;
  cod: string;
  buy: string;
  buySub: string;
}

declare global {
  interface Window {
    MW: MWConfig;
    __magicFallback?: number;
    Shopify?: { designMode?: boolean; routes?: { root?: string } };
    _RSI_COD_FORM_SETTINGS?: {
      productPage?: { isEnabled?: boolean; hideAddToCartButton?: boolean };
      cartPage?: { isEnabled?: boolean };
    };
  }
}

const root = document.documentElement;

export const cfg: MWConfig = window.MW;
export const motionOK = root.classList.contains('mo');
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const page = root.dataset.page ?? 'page';
export const designMode = Boolean(window.Shopify?.designMode);

/** Releasit (pago contraentrega) activo en las fichas. */
export const codOn = () => Boolean(window._RSI_COD_FORM_SETTINGS?.productPage?.isEnabled);
/** Releasit oculta "Agregar al carrito" (así está configurada la tienda). */
export const hideAdd = () => codOn() && Boolean(window._RSI_COD_FORM_SETTINGS?.productPage?.hideAddToCartButton);
/** Releasit reemplaza el pago en /cart. */
export const codCart = () => Boolean(window._RSI_COD_FORM_SETTINGS?.cartPage?.isEnabled);

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

/** $79.990 (pesos colombianos, sin decimales). Recibe centavos, como la API de Shopify.
 *  Sin toLocaleString: cada llamada con locale arma un Intl.NumberFormat (lento en móvil). */
export const money = (cents: number) => `$${String(Math.round(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
