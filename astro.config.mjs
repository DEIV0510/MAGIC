import { defineConfig } from 'astro/config';

// SITE_URL se define al publicar (p. ej. https://magic.vercel.app) para que
// canonical, Open Graph y el sitemap salgan con URL absoluta.
const site = process.env.SITE_URL || undefined;

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
