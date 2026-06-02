export const READ_CACHE_PREFIX = 'gastro_suite_read_cache_';
const PREFIX = READ_CACHE_PREFIX;

function key(branchId, domain) {
    return `${PREFIX}${domain}_${branchId}`;
}

function read(branchId, domain) {
    if (!branchId) return null;
    try {
        const raw = localStorage.getItem(key(branchId, domain));
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function write(branchId, domain, payload) {
    if (!branchId) return;
    try {
        localStorage.setItem(key(branchId, domain), JSON.stringify({
            savedAt: new Date().toISOString(),
            ...payload,
        }));
    } catch {
        /* quota exceeded — ignore */
    }
}

export function saveMenuReadCache(branchId, { categories, items }) {
    write(branchId, 'menu', { categories, items });
}

export function loadMenuReadCache(branchId) {
    const data = read(branchId, 'menu');
    if (!data) return null;
    return {
        categories: Array.isArray(data.categories) ? data.categories : [],
        items: Array.isArray(data.items) ? data.items : [],
        savedAt: data.savedAt ?? null,
    };
}

export function saveTablesReadCache(branchId, { zones, tables }) {
    write(branchId, 'tables', { zones, tables });
}

export function loadTablesReadCache(branchId) {
    const data = read(branchId, 'tables');
    if (!data) return null;
    return {
        zones: Array.isArray(data.zones) ? data.zones : [],
        tables: Array.isArray(data.tables) ? data.tables : [],
        savedAt: data.savedAt ?? null,
    };
}

export function savePosOpsReadCache(branchId, config) {
    write(branchId, 'pos_ops', { config });
}

export function loadPosOpsReadCache(branchId) {
    const data = read(branchId, 'pos_ops');
    return data?.config ?? null;
}

/** Elimina todas las entradas de caché de lectura (menú, mesas, POS, etc.). */
export function clearAllReadCaches() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
}
