import { defineConfig } from 'astro/config';

// Dominio público: canonical, Open Graph y sitemap salen con URL absoluta.
// Con dominio propio, cambiarlo aquí o definir SITE_URL.
const site = process.env.SITE_URL || 'https://magic-tienda.vercel.app';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Todo el CSS en línea: una sola petición bloqueante menos por página.
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  server: { port: 5441, host: true },
});
