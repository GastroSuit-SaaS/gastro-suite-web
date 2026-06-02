const OUTBOX_KEY = 'gastro_suite_offline_outbox';

/**
 * Cola local de operaciones POS pendientes de sincronizar.
 * @returns {Array<{ id: string, type: string, payload: object, createdAt: string, branchId?: string }>}
 */
export function loadOutbox() {
    try {
        const raw = localStorage.getItem(OUTBOX_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveOutbox(entries) {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries ?? []));
}

export function appendOutbox(entry) {
    const list = loadOutbox();
    list.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        ...entry,
    });
    saveOutbox(list);
    return list.length;
}

export function clearOutbox() {
    localStorage.removeItem(OUTBOX_KEY);
}

export function removeOutboxEntry(id) {
    saveOutbox(loadOutbox().filter(e => e.id !== id));
}

export function outboxCount() {
    return loadOutbox().length;
}
