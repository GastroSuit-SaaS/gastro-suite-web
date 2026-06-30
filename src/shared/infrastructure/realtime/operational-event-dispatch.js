import { getActivePinia } from 'pinia';
import { SESSION_KEYS } from '../session-storage.js';
import { OPERATIONAL_EVENT } from './operational-events.js';

/**
 * Enruta eventos operativos a stores Pinia (sin lógica en componentes).
 * @param {import('./operational-events.js').OperationalEventMessage} event
 */
export function dispatchOperationalEvent(event) {
    const pinia = getActivePinia();
    if (!pinia || !event?.type) return;

    let activeBranchId = null;
    try {
        const raw = localStorage.getItem(SESSION_KEYS.BRANCH_ID);
        if (raw) activeBranchId = String(raw);
    } catch { /* ignore */ }
    if (activeBranchId && event.branchId && String(event.branchId) !== activeBranchId) {
        return;
    }

    const type = event.type;

    if (type.startsWith('kitchen.ticket')) {
        import('../../../stations/application/stations.store.js').then(({ useStationsStore }) => {
            useStationsStore(pinia).handleOperationalEvent(event);
        });
        import('../../../pos/application/pos.store.js').then(({ usePosStore }) => {
            usePosStore(pinia).handleOperationalEvent(event);
        });
        return;
    }

    if (type === OPERATIONAL_EVENT.SALE_UPDATED) {
        import('../../../pos/application/pos.store.js').then(({ usePosStore }) => {
            usePosStore(pinia).handleOperationalEvent(event);
        });
        return;
    }

    if (type === OPERATIONAL_EVENT.TABLE_STATUS_CHANGED) {
        import('../../../tables/application/tables.store.js').then(({ useTablesStore }) => {
            useTablesStore(pinia).handleOperationalEvent(event);
        });
        return;
    }

    if (type.startsWith('cash.')) {
        import('../../../cash-register/application/cash-register.store.js').then(({ useCashRegisterStore }) => {
            useCashRegisterStore(pinia).handleOperationalEvent(event);
        });
        return;
    }

    if (type.startsWith('payment.')) {
        import('../../../payments/application/payments.store.js').then(({ usePaymentsStore }) => {
            usePaymentsStore(pinia).handleOperationalEvent(event);
        });
        import('../../../dashboard/application/dashboard.store.js').then(({ useDashboardStore }) => {
            useDashboardStore(pinia).handleOperationalEvent(event);
        });
        return;
    }

    if (type.startsWith('reservation.')) {
        import('../../../tables/application/tables.store.js').then(({ useTablesStore }) => {
            useTablesStore(pinia).handleOperationalEvent(event);
        });
        import('../../../tables/application/tables.store.js').then(({ useTablesStore }) => {
            useTablesStore(pinia).handleReservationOperationalEvent(event);
        });
    }
}

/**
 * Resync REST tras reconexión del socket.
 */
export async function resyncOperationalStores() {
    const pinia = getActivePinia();
    if (!pinia) return;

    const jobs = [];

    const { useStationsStore } = await import('../../../stations/application/stations.store.js');
    const { useTablesStore } = await import('../../../tables/application/tables.store.js');
    const { useCashRegisterStore } = await import('../../../cash-register/application/cash-register.store.js');
    const { usePaymentsStore } = await import('../../../payments/application/payments.store.js');
    const { usePosStore } = await import('../../../pos/application/pos.store.js');

    const stations = useStationsStore(pinia);
    const tables = useTablesStore(pinia);
    const cash = useCashRegisterStore(pinia);
    const payments = usePaymentsStore(pinia);
    const pos = usePosStore(pinia);

    jobs.push(stations.fetchTicketsSilent?.() ?? stations.fetchAll());
    jobs.push(tables.fetchAllSilent?.() ?? tables.fetchAll());
    jobs.push(cash.refreshOpenSession({ skipMovements: true }));
    jobs.push(payments.fetchAllSilent?.() ?? payments.fetchAll());

    if (pos.currentSale?.id) {
        jobs.push(pos.refreshKitchenTickets());
    }

    await Promise.allSettled(jobs);
}
