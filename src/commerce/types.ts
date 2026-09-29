export interface CartLine {
  /** slug:color:talla — una línea por combinación. */
  key: string;
  slug: string;
  name: string;
  colorId: string | null;
  colorLabel: string | null;
  size: string | null;
  qty: number;
  image: string | null;
  /** COP. null mientras no haya precios reales. */
  price: number | null;
  /** Id de variante de Shopify (gid://shopify/ProductVariant/…) cuando exista la tienda. */
  variantId: string | null;
  /** Cómo pintar la miniatura: 'white' | 'studio' | 'text'. */
  bg?: string | null;
  /** Palabra para la miniatura tipográfica (prendas sin foto). */
  mark?: string | null;
}

export type NewLine = Omit<CartLine, 'key' | 'qty'>;

export interface CheckoutProvider {
  id: 'whatsapp' | 'shopify';
  /** true si este proveedor puede cobrar estas líneas. */
  canHandle(lines: CartLine[]): boolean;
  checkout(lines: CartLine[]): Promise<void>;
}
