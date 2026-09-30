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
  /** COP por unidad, envío incluido. null = por confirmar. */
  price: number | null;
  /** Cómo pintar la miniatura: 'white' | 'studio' | 'photo'. */
  bg?: string | null;
}

export type NewLine = Omit<CartLine, 'key' | 'qty'>;

export interface CheckoutProvider {
  id: 'whatsapp' | 'shopify';
  /** true si este proveedor puede cobrar estas líneas. */
  canHandle(lines: CartLine[]): boolean;
  checkout(lines: CartLine[]): Promise<void>;
}
