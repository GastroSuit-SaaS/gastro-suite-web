/**
 * Falla el build si el bundle aún usa la ruta obsoleta de registro (/support/auth).
 * El host de la API (VITE_PLATFORM_API_URL) sí se embebe a propósito en el build.
 */
import fs from 'node:fs';
import path from 'node:path';

const ASSETS_DIR = path.resolve('dist/assets');
/** Ruta de registro antigua — el frontend debe usar /auth/sign-up. */
const FORBIDDEN = ['support/auth'];

if (!fs.existsSync(ASSETS_DIR)) {
    console.error('[verify-production-build] No existe dist/assets. Ejecuta npm run build primero.');
    process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.js'));
const violations = [];

for (const file of files) {
    const content = fs.readFileSync(path.join(ASSETS_DIR, file), 'utf8');
    for (const needle of FORBIDDEN) {
        if (content.includes(needle)) {
            violations.push({ file, needle });
        }
    }
}

if (violations.length > 0) {
    console.error('[verify-production-build] Bundle inválido: aún referencia registro en /support/auth');
    for (const v of violations) {
        console.error(`  - "${v.needle}" en dist/assets/${v.file}`);
    }
    console.error('  Usa VITE_IAM_ENDPOINT=/auth y sign-up en /auth/sign-up.');
    process.exit(1);
}

const indexJs = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
if (indexJs) {
    const main = fs.readFileSync(path.join(ASSETS_DIR, indexJs), 'utf8');
    if (main.includes('Falta VITE_PLATFORM_API_URL')) {
        console.error('[verify-production-build] El bundle NO tiene VITE_PLATFORM_API_URL embebida.');
        console.error('  Asegura .env.production en el repo o variables en Cloudflare Pages antes del build.');
        process.exit(1);
    }
    const apiMatch = main.match(/https:\/\/[a-z0-9.-]+\.railway\.app\/api\/v1/i);
    if (apiMatch) {
        console.info(`[verify-production-build] OK — API en bundle: ${apiMatch[0]}`);
    }
}
