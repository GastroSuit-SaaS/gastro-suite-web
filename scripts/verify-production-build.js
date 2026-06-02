/**
 * Falla el build si el bundle contiene rutas/host obsoletos (support/auth, preprod hardcodeado).
 * Uso: npm run build && node scripts/verify-production-build.js
 */
import fs from 'node:fs';
import path from 'node:path';

const ASSETS_DIR = path.resolve('dist/assets');
const FORBIDDEN = [
    'support/auth',
    'gastro-api-preprod-production-1ece.up.railway.app',
];

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
    console.error('[verify-production-build] Bundle inválido para producción:');
    for (const v of violations) {
        console.error(`  - "${v.needle}" en dist/assets/${v.file}`);
    }
    process.exit(1);
}

console.info('[verify-production-build] OK — sin support/auth ni host preprod en el bundle.');
