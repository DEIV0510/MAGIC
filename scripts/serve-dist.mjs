// Servidor estático mínimo para revisar dist/ tal como quedará publicado.
// Uso: node scripts/serve-dist.mjs [puerto]   (por defecto 5442)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2] || process.env.PORT || 5442);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    let status = 200;
    if (!fs.existsSync(file)) {
      // /hombre → /hombre/ como en Vercel con trailingSlash
      if (!url.pathname.endsWith('/') && fs.existsSync(path.join(root, url.pathname, 'index.html'))) {
        res.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      file = path.join(root, '404.html');
      status = 404;
    }
    const ext = path.extname(file);
    const body = fs.readFileSync(file);
    const headers = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    const compressible = /\.(html|js|css|json|xml|txt|svg)$/.test(ext);
    if (compressible && /\bbr\b/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(status, { ...headers, 'Content-Encoding': 'br' });
      res.end(zlib.brotliCompressSync(body));
    } else {
      res.writeHead(status, headers);
      res.end(body);
    }
  })
  .listen(port, () => console.log(`MAGIC → http://localhost:${port}/`));
