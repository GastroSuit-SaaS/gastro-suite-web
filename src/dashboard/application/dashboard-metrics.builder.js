import { OperationalMetrics } from '../domain/models/dashboard-metric.entity.js';
import { PAYMENT_METHOD_KEYS } from '../domain/dashboard-payment-methods.js';
import { paymentNetCollected } from '../../payments/domain/payment-net.js';

/**
 * Construye el mismo contrato anidado desde sub-stores (fallback offline / API caída).
 */
export function buildOperationalMetricsFromClientStores({
    paymentsStore,
    posStore,
    tablesStore,
    stationsStore,
    cashRegisterStore,
    inventoryStore,
    reservationsCount = 0,
    businessDate = new Date().toISOString().slice(0, 10),
}) {
    const todaysPayments = paymentsStore.todaysPayments ?? [];
    const revenue = todaysPayments.reduce((sum, p) => sum + paymentNetCollected(p), 0);
    const paymentCount = todaysPayments.length;
    const byMethod = Object.fromEntries(PAYMENT_METHOD_KEYS.map((k) => [k, 0]));
    todaysPayments.forEach((p) => {
        if (p.method in byMethod) {
            byMethod[p.method] += paymentNetCollected(p);
        }
    });

    const topMap = {};
    todaysPayments.forEach((p) => {
        p.items?.forEach((item) => {
            const key = item.name ?? 'Producto';
            topMap[key] = (topMap[key] ?? 0) + (item.qty ?? 1);
        });
    });
    const topItems = Object.entries(topMap)
        .map(([name, quantity]) => ({ itemId: null, name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const tickets = stationsStore.tickets ?? [];
    const stations = (stationsStore.activeStations ?? []).map((st) => ({
        stationId: st.id,
        stationName: st.name,
        stationColor: st.color,
        ticketCount: tickets.filter((t) => t.stationId === st.id).length,
    }));

    return new OperationalMetrics({
        businessDate,
        sales: {
            revenue,
            paymentCount,
            avgTicket: paymentCount > 0 ? revenue / paymentCount : 0,
            byMethod,
            topItems,
        },
        diningRoom: {
            totalTables: tablesStore.totalTables ?? 0,
            occupiedTables: tablesStore.occupiedTables?.length ?? 0,
            availableTables: tablesStore.availableTables?.length ?? 0,
            reservedTables: tablesStore.reservedTables?.length ?? 0,
            cleaningTables: tablesStore.cleaningTables?.length ?? 0,
            occupancyRate: tablesStore.occupancyRate ?? 0,
            reservationsToday: reservationsCount,
            activeOrders: posStore.activeOrders?.length ?? posStore.totalInProcess ?? 0,
        },
        kitchen: {
            received: stationsStore.receivedTickets?.length ?? 0,
            preparing: stationsStore.preparingTickets?.length ?? 0,
            ready: stationsStore.readyCount ?? 0,
            totalToday: stationsStore.totalToday ?? 0,
            stations,
        },
        cashRegister: {
            open: !!cashRegisterStore.hasOpenSession,
            shiftName: cashRegisterStore.currentSession?.shiftName ?? '',
            expectedCash: cashRegisterStore.sessionExpectedCash ?? 0,
            paymentCount: cashRegisterStore.sessionSalesCount ?? 0,
        },
        inventory: {
            lowStockCount: inventoryStore?.lowStockProducts?.length ?? 0,
        },
    });
}
