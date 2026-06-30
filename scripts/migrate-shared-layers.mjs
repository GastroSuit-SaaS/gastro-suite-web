#!/usr/bin/env node
/**
 * One-time migration: shared/composables → shared/presentation/composables
 * shared/utils → shared/domain | shared/infrastructure/export
 * Updates imports across src/.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'src');
const SHARED = join(SRC, 'shared');

function walk(dir, files = []) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, files);
        else if (/\.(vue|js|mjs)$/.test(name)) files.push(full);
    }
    return files;
}

// ── 1. Move files ───────────────────────────────────────────────────────────
mkdirSync(join(SHARED, 'presentation', 'composables'), { recursive: true });
mkdirSync(join(SHARED, 'domain'), { recursive: true });
mkdirSync(join(SHARED, 'infrastructure', 'export'), { recursive: true });

const composablesDir = join(SHARED, 'composables');
if (statSync(composablesDir, { throwIfNoEntry: false })?.isDirectory()) {
    for (const name of readdirSync(composablesDir)) {
        if (!name.endsWith('.js')) continue;
        renameSync(join(composablesDir, name), join(SHARED, 'presentation', 'composables', name));
    }
    rmSync(composablesDir, { recursive: true, force: true });
}

const utilsDir = join(SHARED, 'utils');
if (statSync(utilsDir, { throwIfNoEntry: false })?.isDirectory()) {
    const moves = [
        ['debounce.js', join(SHARED, 'domain', 'debounce.js')],
        ['order-display.js', join(SHARED, 'domain', 'order-display.js')],
        ['cash-movement-display.js', join(SHARED, 'domain', 'cash-movement-display.js')],
        ['excel-export.js', join(SHARED, 'infrastructure', 'export', 'excel-export.js')],
    ];
    for (const [name, dest] of moves) {
        const src = join(utilsDir, name);
        if (statSync(src, { throwIfNoEntry: false })?.isFile()) {
            renameSync(src, dest);
        }
    }
    rmSync(utilsDir, { recursive: true, force: true });
}

// ── 2. Rewrite imports project-wide ───────────────────────────────────────
const replacements = [
    ['shared/composables/', 'shared/presentation/composables/'],
    ['shared/utils/excel-export.js', 'shared/infrastructure/export/excel-export.js'],
    ['shared/utils/order-display.js', 'shared/domain/order-display.js'],
    ['shared/utils/cash-movement-display.js', 'shared/domain/cash-movement-display.js'],
    ['shared/utils/debounce.js', 'shared/domain/debounce.js'],
];

// Fix paths inside shared/presentation/composables/*.js (one level deeper)
const composableInternal = [
    ["from '../../iam/", "from '../../../iam/"],
    ["from '../../company/", "from '../../../company/"],
    ["from '../../cash-register/", "from '../../../cash-register/"],
    ["from '../../pos/", "from '../../../pos/"],
    ["from '../../menu/", "from '../../../menu/"],
    ["from '../../tables/", "from '../../../tables/"],
    ["from '../../stations/", "from '../../../stations/"],
    ["from '../../platform/", "from '../../../platform/"],
    ["from '../../communication/", "from '../../../communication/"],
    ["from '../../branches/", "from '../../../branches/"],
    ["from '../presentation/constants/", "from '../constants/"],
    ["from '../infrastructure/", "from '../../infrastructure/"],
    ["from '../application/", "from '../../application/"],
];

// Fix shared/presentation/components → composables (sibling)
const sharedPresentationComponent = [
    ["from '../../composables/", "from '../composables/"],
    ["from '../../utils/excel-export.js", "from '../../infrastructure/export/excel-export.js"],
];

let updated = 0;
for (const file of walk(SRC)) {
    let content = readFileSync(file, 'utf8');
    const original = content;

    for (const [from, to] of replacements) {
        content = content.split(from).join(to);
    }

    const rel = file.replace(/\\/g, '/');
    if (rel.includes('/shared/presentation/composables/')) {
        for (const [from, to] of composableInternal) {
            content = content.split(from).join(to);
        }
    }
    if (rel.includes('/shared/presentation/components/')) {
        for (const [from, to] of sharedPresentationComponent) {
            content = content.split(from).join(to);
        }
    }

    if (content !== original) {
        writeFileSync(file, content, 'utf8');
        updated++;
    }
}

console.log(`✅ migrate-shared-layers — ${updated} archivo(s) actualizado(s)`);
