#!/usr/bin/env node
/**
 * Verificación de cumplimiento arquitectónico por módulo feature.
 * Ver docs/ARCHITECTURE.md §3
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';
const SKIP = new Set(['shared', 'public', 'router', 'assets', 'shared-v2']);
const issues = [];
const importRe = /from\s+['"]([^'"]+)['"]/g;

function walk(dir, files = []) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, files);
        else if (/\.(vue|js)$/.test(name)) files.push(full);
    }
    return files;
}

function foreignStoreImport(imp, ownModule) {
    const m = imp.match(/\.\.\/\.\.\/\.\.\/([^/]+)\/application\/([^/]+)\.store\.js/);
    if (!m) return null;
    if (m[1] === ownModule || m[1] === 'shared') return null;
    return m[1];
}

const modules = readdirSync(SRC)
    .filter((n) => !SKIP.has(n) && statSync(join(SRC, n)).isDirectory())
    .sort();

const report = [];

for (const mod of modules) {
    const modReport = { module: mod, ok: true, checks: [] };
    const pres = join(SRC, mod, 'presentation');
    const storePath = join(SRC, mod, 'application', `${mod}.store.js`);
    const routesPath = join(SRC, mod, 'presentation', `${mod}.routes.js`);
    const apiPath = join(SRC, mod, 'infrastructure', 'api', `${mod}.api.js`);

    const addIssue = (type, detail) => {
        modReport.ok = false;
        modReport.checks.push({ status: 'FAIL', type, ...detail });
        issues.push({ module: mod, type, ...detail });
    };

    const addOk = (type, detail = {}) => {
        modReport.checks.push({ status: 'OK', type, ...detail });
    };

    if (!existsSync(storePath)) addIssue('missing-store', { path: storePath });
    else addOk('store');

    if (mod !== 'communication' && !existsSync(routesPath)) {
        addIssue('missing-routes', { path: routesPath });
    } else if (existsSync(routesPath) || mod === 'communication') {
        addOk('routes', { note: mod === 'communication' ? 'transversal embebido' : undefined });
    }

    if (!existsSync(apiPath) && mod !== 'communication') addIssue('missing-api', { path: apiPath });
    else if (mod === 'communication') {
        const commApi = join(SRC, mod, 'infrastructure', 'api', 'notifications.api.js');
        if (!existsSync(commApi)) addIssue('missing-api', { path: commApi });
        else addOk('api', { note: 'notifications.api.js' });
    } else addOk('api');

    if (!existsSync(pres)) {
        addIssue('missing-presentation', {});
        report.push(modReport);
        continue;
    }

    for (const forbidden of ['composables', 'utils', 'helpers']) {
        if (existsSync(join(pres, forbidden))) {
            addIssue('forbidden-folder', { folder: `presentation/${forbidden}/` });
        } else {
            addOk(`no-${forbidden}`);
        }
    }

    for (const file of walk(pres)) {
        const rel = file.replace(/\\/g, '/');
        const content = readFileSync(file, 'utf8');
        importRe.lastIndex = 0;
        let m;
        while ((m = importRe.exec(content)) !== null) {
            const imp = m[1];
            if (imp.includes('/presentation/utils/') || imp.includes('/presentation/helpers/')) {
                addIssue('legacy-import', { file: rel, import: imp });
            }
            if (imp.includes(`/${mod}/presentation/composables/`)) {
                addIssue('module-composable-import', { file: rel, import: imp });
            }
            const foreign = foreignStoreImport(imp, mod);
            if (foreign) addIssue('foreign-store', { file: rel, import: imp, foreign });
            if (imp.includes('/infrastructure/') && !imp.includes('/shared/infrastructure/')) {
                addIssue('presentation-infrastructure', { file: rel, import: imp });
            }
            if (imp.includes(`/${mod}/application/`) && !imp.includes('.store.js')) {
                addIssue('presentation-application', { file: rel, import: imp });
            }
        }
    }

    if (modReport.ok) addOk('presentation-clean');
    report.push(modReport);
}

console.log('\n=== Verificación de módulos feature ===\n');
for (const r of report) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.module}`);
    for (const c of r.checks.filter((x) => x.status === 'FAIL')) {
        console.log(`   FAIL ${c.type}${c.file ? `: ${c.file}` : ''}${c.folder ? `: ${c.folder}` : ''}${c.import ? `\n        → ${c.import}` : ''}`);
    }
}

console.log(`\nResumen: ${report.filter((r) => r.ok).length}/${report.length} módulos OK`);

if (issues.length === 0) {
    console.log('\n✅ Todos los módulos feature cumplen la arquitectura.\n');
    process.exit(0);
}

console.log(`\n❌ ${issues.length} incumplimiento(s) detectado(s).\n`);
process.exit(1);
