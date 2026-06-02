/**
 * Cloudflare Pages: sirve 404.html solo cuando no existe el archivo estático.
 * Evita `/* /index.html 200`, que devuelve HTML (MIME text/html) para /assets/*.js
 * inexistentes y rompe los dynamic imports de Vite.
 */
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

if (!fs.existsSync(indexPath)) {
    console.error('[copy-spa-fallback] No existe dist/index.html. Ejecuta vite build primero.');
    process.exit(1);
}

fs.copyFileSync(indexPath, fallbackPath);
console.info('[copy-spa-fallback] dist/404.html listo para Cloudflare Pages.');
