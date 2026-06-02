import { getActivePinia } from 'pinia';

const PRESERVE_STORE_IDS = new Set(['iam']);

/**
 * Elimina del Pinia todos los stores excepto IAM.
 * La próxima vez que un módulo use useXStore(), se crea estado vacío.
 * Evita mostrar datos del usuario anterior tras cerrar sesión en la misma pestaña.
 */
export function resetApplicationStores() {
    const pinia = getActivePinia();
    if (!pinia?._s) return;

    for (const store of pinia._s.values()) {
        if (PRESERVE_STORE_IDS.has(store.$id)) continue;
        store.$dispose();
    }
}
