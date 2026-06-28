import { loadOutbox, saveOutbox } from '../infrustructure/offline/outbox-storage.js';
import { resetApplicationStores } from './reset-application-stores.js';
import { resetOperationalSocketClient } from '../infrustructure/realtime/operational-socket.js';

export const BRANCH_CHANGED_EVENT = 'gastro:branch-changed';

/**
 * Advertencias antes de cambiar o dejar la sucursal activa (OWNER).
 * @param {string|null} activeBranchId
 * @param {{ currentSale?: object|null }} [posContext]
 * @returns {string[]}
 */
export function getBranchSwitchWarnings(activeBranchId, posContext = {}) {
    if (!activeBranchId) return [];

    const warnings = [];
    const outbox = loadOutbox().filter(
        (entry) => !entry.branchId || entry.branchId === activeBranchId,
    );
    if (outbox.length) {
        warnings.push(
            `${outbox.length} operación${outbox.length === 1 ? '' : 'es'} POS pendiente${outbox.length === 1 ? '' : 's'} de sincronizar`,
        );
    }

    const sale = posContext.currentSale;
    if (sale?.items?.length) {
        const unsent = sale.items.filter((item) => !item.isSent).length;
        if (unsent > 0) {
            warnings.push(`Orden activa con ${unsent} ítem${unsent === 1 ? '' : 's'} sin enviar a cocina`);
        } else {
            warnings.push('Orden activa en curso en el POS');
        }
    }

    return warnings;
}

/**
 * Limpia outbox de la sucursal que se abandona.
 */
export function clearOutboxForBranch(branchId) {
    if (!branchId) return;
    saveOutbox(loadOutbox().filter((entry) => entry.branchId !== branchId));
}

/**
 * Resetea stores operativos y socket; emite evento de cambio de sucursal.
 */
export function resetBranchOperationalContext(previousBranchId, nextBranchId) {
    resetApplicationStores();
    resetOperationalSocketClient();
    if (previousBranchId) {
        clearOutboxForBranch(previousBranchId);
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(BRANCH_CHANGED_EVENT, {
            detail: { previousBranchId, branchId: nextBranchId },
        }));
    }
}
