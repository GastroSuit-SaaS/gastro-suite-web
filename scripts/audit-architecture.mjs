#!/usr/bin/env node
/**
 * Auditoría arquitectónica — reglas de dependencia entre capas.
 * Ver docs/ARCHITECTURE.md
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'src');
const SKIP = new Set(['shared-v2', 'public', 'assets', 'router']);

const violations = [];

function sharedLayer(rel) {
    if (!rel.startsWith('shared/')) return null;
    if (rel.includes('/presentation/')) return 'presentation';
    if (rel.includes('/application/')) return 'application';
    if (rel.includes('/domain/')) return 'domain';
    if (rel.includes('/infrastructure/')) return 'infrastructure';
    return null;
}

function walk(dir, files = []) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, files);
        else if (/\.(vue|js)$/.test(name)) files.push(full);
    }
    return files;
}

function moduleName(filePath) {
    const rel = relative(SRC, filePath).replace(/\\/g, '/');
    const top = rel.split('/')[0];
    if (top === 'shared') return 'shared';
    return SKIP.has(top) ? null : top;
}

function isForeignModuleStoreImport(imp, ownModule) {
    const m = imp.match(/\.\.\/\.\.\/([^/]+)\/application\/[^/]+\.store\.js/);
    if (!m) return false;
    const target = m[1];
    return target !== ownModule && target !== 'shared';
}

function isForeignModuleFacadeImport(imp, ownModule) {
    const m = imp.match(/\.\.\/\.\.\/([^/]+)\/application\/[^/]+\.facade\.js/);
    if (!m) return false;
    const target = m[1];
    return target !== ownModule && target !== 'shared';
}

function checkForbiddenPresentationFolders() {
    for (const mod of readdirSync(SRC)) {
        if (SKIP.has(mod) || mod === 'shared') continue;
        const pres = join(SRC, mod, 'presentation');
        if (!existsSync(pres)) continue;
        for (const forbidden of ['utils', 'helpers', 'composables']) {
            const dir = join(pres, forbidden);
            if (existsSync(dir)) {
                violations.push({
                    rule: 'forbidden-presentation-folder',
                    file: `${mod}/presentation/${forbidden}/`,
                    import: forbidden === 'composables'
                        ? 'Eliminar carpeta; inline en .vue o mover a shared/presentation/composables/'
                        : 'Eliminar carpeta; mover lógica a application/ y exponer vía store',
                });
            }
        }
    }
}

function checkFile(filePath) {
    const rel = relative(SRC, filePath).replace(/\\/g, '/');
    const mod = moduleName(filePath);

    const content = readFileSync(filePath, 'utf8');
    const importRe = /from\s+['"]([^'"]+)['"]/g;

    // Rutas legacy de shared (post-migración)
    let m;
    while ((m = importRe.exec(content)) !== null) {
        const imp = m[1];
        if (imp.includes('shared/composables/') || imp.includes('shared/utils/')) {
            violations.push({ rule: 'shared-legacy-path', file: rel, import: imp });
        }
        if (imp.includes('/presentation/utils/') || imp.includes('/presentation/helpers/')) {
            violations.push({ rule: 'presentation-legacy-folder-import', file: rel, import: imp });
        }
    }

    if (!mod) return;

    const layer = mod === 'shared'
        ? sharedLayer(rel)
        : rel.includes('/presentation/') ? 'presentation'
        : rel.includes('/application/') ? 'application'
        : rel.includes('/domain/') ? 'domain'
        : rel.includes('/infrastructure/') ? 'infrastructure'
        : null;

    if (!layer) return;

    importRe.lastIndex = 0;
    while ((m = importRe.exec(content)) !== null) {
        const imp = m[1];
        if (layer === 'presentation' && (imp.includes('/infrastructure/') || imp.includes('/assemblers/'))) {
            // shared/presentation: composables y shell usan infra interna (env, realtime, export)
            if (mod === 'shared') continue;
            if (imp.includes('/shared/infrastructure/')) continue;
            violations.push({ rule: 'presentation→infrastructure', file: rel, import: imp });
        }
        if (layer === 'application' && imp.includes('/infrastructure/')) {
            const otherMod = imp.match(/\.\.\/\.\.\/([^/]+)\/infrastructure/);
            if (otherMod && otherMod[1] !== mod && otherMod[1] !== 'shared') {
                violations.push({ rule: 'application→foreign-infrastructure', file: rel, import: imp });
            }
        }
        if (layer === 'domain' && (imp.includes('/infrastructure/') || imp.includes('/presentation/'))) {
            violations.push({ rule: 'domain→outer-layer', file: rel, import: imp });
        }
        if (mod === 'shared' && layer === 'application' && imp.includes('/presentation/')) {
            violations.push({ rule: 'shared-application→presentation', file: rel, import: imp });
        }
        if (mod === 'shared' && layer === 'domain' && imp.includes('/')) {
            if (imp.includes('/infrastructure/') || imp.includes('/presentation/') || imp.includes('/application/')) {
                violations.push({ rule: 'shared-domain→outer-layer', file: rel, import: imp });
            }
        }
        if (
            mod !== 'shared'
            && mod !== 'public'
            && layer === 'presentation'
            && imp.includes(`/${mod}/application/`)
            && !imp.includes('.store.js')
        ) {
            violations.push({ rule: 'presentation→application', file: rel, import: imp });
        }

        // Composables de módulo feature: carpeta prohibida (usar shared/presentation/composables)
        if (
            mod !== 'shared'
            && layer === 'presentation'
            && rel.includes('/presentation/composables/')
        ) {
            violations.push({
                rule: 'forbidden-module-composable',
                file: rel,
                import: 'Mover a shared/presentation/composables/ o inline en el .vue',
            });
        }

        // Composables de módulo feature: sin stores ajenos ni application/infrastructure propios
        if (
            mod !== 'shared'
            && layer === 'presentation'
            && rel.includes('/presentation/composables/')
        ) {
            if (isForeignModuleStoreImport(imp, mod)) {
                violations.push({ rule: 'module-composable→foreign-store', file: rel, import: imp });
            }
            if (isForeignModuleFacadeImport(imp, mod)) {
                violations.push({ rule: 'module-composable→foreign-facade', file: rel, import: imp });
            }
            if (imp.includes(`/${mod}/application/`) && !imp.includes('.store.js')) {
                violations.push({ rule: 'module-composable→application', file: rel, import: imp });
            }
            if (imp.includes(`/${mod}/infrastructure/`)) {
                violations.push({ rule: 'module-composable→infrastructure', file: rel, import: imp });
            }
        }

        // Presentation de módulo feature: solo store propio (cross-module vía facade en store)
        if (
            mod !== 'shared'
            && mod !== 'public'
            && layer === 'presentation'
            && isForeignModuleStoreImport(imp, mod)
        ) {
            violations.push({ rule: 'presentation→foreign-store', file: rel, import: imp });
        }

        // Shell (public/ + shared/presentation): solo shell.facade, no stores ajenos
        const isShellPresentation =
            (mod === 'public' && layer === 'presentation')
            || (mod === 'shared' && layer === 'presentation');
        if (isShellPresentation && isForeignModuleStoreImport(imp, 'shared')) {
            const isShellFacade = imp.includes('shared/application/shell.facade.js');
            if (!isShellFacade) {
                violations.push({
                    rule: 'shell→foreign-store',
                    file: rel,
                    import: `${imp} — usar shared/application/shell.facade.js`,
                });
            }
        }
    }
}

checkForbiddenPresentationFolders();
for (const f of walk(SRC)) checkFile(f);

if (violations.length === 0) {
    console.log('✅ audit:architecture — sin violaciones detectadas');
    process.exit(0);
}

console.error(`❌ audit:architecture — ${violations.length} violación(es):\n`);
for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}\n    → ${v.import}`);
}
process.exit(1);
