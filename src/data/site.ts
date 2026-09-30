// Datos de marca. Todo lo que aparece aquí viene del brief, de las etiquetas de las
// prendas o de la información enviada por el cliente.
// Los campos en null NO se muestran en la web hasta que tengan un valor real.
export const site = {
  name: 'MAGIC WORLD',
  tagline: 'Chaquetas, buzos y abrigos para hombre y mujer',
  description:
    'Chaquetas, buzos y abrigos para hombre y mujer en algodón perchado Mónaco, bisonte ovejero y nailon impermeable. Precios con envío incluido. Pedidos por WhatsApp.',
  locale: 'es_CO',
  lang: 'es-CO',
  currency: 'COP',
  whatsapp: {
    // Número del brief: 323 898 7323 (Colombia, +57).
    number: '573238987323',
    display: '323 898 7323',
  },
  // Sin datos reales todavía: se ocultan en el footer mientras sean null.
  social: {
    instagram: null as string | null,
    tiktok: null as string | null,
    facebook: null as string | null,
  },
  paper: '#F0EFEB',
} as const;

export const nav = [
  { label: 'Inicio', href: '/' },
  { label: 'Hombre', href: '/hombre/' },
  { label: 'Mujer', href: '/mujer/' },
  { label: 'Colección', href: '/coleccion/' },
  { label: 'Contacto', href: '/#contacto' },
] as const;
