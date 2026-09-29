import type { APIRoute } from 'astro';
import { products, collections } from '@/data/products';

// Con SITE_URL definido sale completo; sin dominio aún, un urlset vacío (válido).
export const GET: APIRoute = ({ site }) => {
  const paths = ['/', ...collections.map((c) => c.path), ...products.map((p) => `/producto/${p.slug}/`), '/politicas/'];
  const urls = site ? paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n') : '';
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
