/**
 * Dashboard Domain — contrato alineado con GET /branches/{id}/dashboard/metrics
 *
 * Secciones operativas: sales · diningRoom · kitchen · cashRegister · inventory
 */
export const DASHBOARD_TIMEZONE = 'America/Lima';

const EMPTY_BY_METHOD = Object.freeze({
    cash: 0,
    card: 0,
    yape: 0,
    plin: 0,
});

export class OperationalMetrics {
    constructor({
        businessDate = null,
        timezone = DASHBOARD_TIMEZONE,
        sales = {},
        diningRoom = {},
        kitchen = {},
        cashRegister = {},
        inventory = {},
    } = {}) {
        this.businessDate = businessDate;
        this.timezone = timezone ?? DASHBOARD_TIMEZONE;
        this.sales = {
            revenue: Number(sales.revenue ?? 0),
            paymentCount: Number(sales.paymentCount ?? 0),
            avgTicket: Number(sales.avgTicket ?? 0),
            byMethod: { ...EMPTY_BY_METHOD, ...(sales.byMethod ?? {}) },
            topItems: (sales.topItems ?? []).map(normalizeTopItem),
        };
        this.diningRoom = {
            totalTables: Number(diningRoom.totalTables ?? 0),
            occupiedTables: Number(diningRoom.occupiedTables ?? 0),
            availableTables: Number(diningRoom.availableTables ?? 0),
            reservedTables: Number(diningRoom.reservedTables ?? 0),
            cleaningTables: Number(diningRoom.cleaningTables ?? 0),
            occupancyRate: Number(diningRoom.occupancyRate ?? 0),
            reservationsToday: Number(diningRoom.reservationsToday ?? 0),
            activeOrders: Number(diningRoom.activeOrders ?? 0),
        };
        this.kitchen = {
            received: Number(kitchen.received ?? 0),
            preparing: Number(kitchen.preparing ?? 0),
            ready: Number(kitchen.ready ?? 0),
            totalToday: Number(kitchen.totalToday ?? 0),
            stations: (kitchen.stations ?? []).map(normalizeStation),
        };
        this.cashRegister = {
            open: !!cashRegister.open,
            shiftName: cashRegister.shiftName ?? '',
            expectedCash: Number(cashRegister.expectedCash ?? 0),
            paymentCount: Number(cashRegister.paymentCount ?? 0),
        };
        this.inventory = {
            lowStockCount: Number(inventory.lowStockCount ?? 0),
        };
    }
}

function normalizeTopItem(item) {
    return {
        itemId: item.itemId ?? null,
        name: item.name ?? 'Producto',
        quantity: Number(item.quantity ?? item.qty ?? 0),
    };
}

function normalizeStation(st) {
    return {
        stationId: st.stationId ?? st.id ?? null,
        stationName: st.stationName ?? st.name ?? '',
        stationColor: st.stationColor ?? st.color ?? '#6366f1',
        ticketCount: Number(st.ticketCount ?? 0),
    };
}

/** @deprecated usar OperationalMetrics */
export class DashboardMetric extends OperationalMetrics {}
