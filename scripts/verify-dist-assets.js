/**
 * Falla el build si index.html referencia assets/*.js|css que no existen en dist/.
 * Evita desplegar HTML que apunta a chunks faltantes (causa MIME text/html en Cloudflare).
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const INDEX = path.join(DIST, 'index.html');

const ASSET_RE = /\/assets\/([a-zA-Z0-9_.-]+\.(?:js|css|woff2?|ttf|eot|svg|png))/g;

if (!fs.existsSync(INDEX)) {
    console.error('[verify-dist-assets] Falta dist/index.html');
    process.exit(1);
}

const html = fs.readFileSync(INDEX, 'utf8');
const referenced = new Set();
for (const match of html.matchAll(ASSET_RE)) {
    referenced.add(match[1]);
}

const missing = [];
for (const file of referenced) {
    const full = path.join(DIST, 'assets', file);
    if (!fs.existsSync(full)) {
        missing.push(file);
    }
}

if (missing.length > 0) {
    console.error('[verify-dist-assets] index.html referencia archivos que NO están en dist/assets/:');
    for (const f of missing) {
        console.error(`  - ${f}`);
    }
    process.exit(1);
}

console.info(`[verify-dist-assets] OK — ${referenced.size} assets referenciados en index.html presentes en dist/`);
