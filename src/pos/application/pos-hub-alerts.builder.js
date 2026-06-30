import { buildUpcomingReservations } from '../../dashboard/application/dashboard-view.helpers.js';

/**
 * Alertas operativas del POS Hub — orquestación vía stores (application).
 */
export function buildPosHubAlerts({
    cashRegisterStore,
    stationsStore,
    tablesStore,
    inventoryStore,
    activeOrdersCount = 0,
    entitlements = null,
}) {
    const alerts = [];
    const kitchen = entitlements?.hasKitchen !== false;
    const reservations = entitlements?.hasReservations === true;
    const inventory = entitlements?.hasInventory === true;

    if (!cashRegisterStore?.hasOpenSession) {
        alerts.push({
            key: 'cash',
            icon: 'pi-wallet',
            tone: 'warn',
            title: 'Caja cerrada',
            detail: 'Abre turno de caja antes de cobrar en efectivo.',
            actionLabel: 'Ir a caja',
            actionRoute: '/cash-register',
        });
    }

    const ready = stationsStore?.readyCount ?? 0;
    if (kitchen && ready > 0) {
        alerts.push({
            key: 'kitchen',
            icon: 'pi-bell',
            tone: 'info',
            title: 'Pass de cocina',
            detail: `${ready} pedido(s) listos para servir.`,
            actionLabel: 'Ver estaciones',
            actionRoute: '/stations',
        });
    }

    const upcoming = buildUpcomingReservations(tablesStore?.activeReservations ?? [], 5);
    if (reservations && upcoming.length > 0) {
        alerts.push({
            key: 'reservations',
            icon: 'pi-calendar',
            tone: 'info',
            title: 'Reservas próximas',
            detail: `${upcoming.length} reserva(s) en las próximas horas.`,
            actionLabel: 'Ver agenda',
            actionRoute: '/tables/reservations',
        });
    }

    const lowStock = inventoryStore?.lowStockProducts?.length ?? 0;
    if (inventory && lowStock > 0) {
        alerts.push({
            key: 'stock',
            icon: 'pi-box',
            tone: 'danger',
            title: 'Stock bajo',
            detail: `${lowStock} producto(s) bajo el mínimo.`,
            actionLabel: 'Ver inventario',
            actionRoute: '/inventory',
        });
    }

    const cleaning = tablesStore?.cleaningTables?.length ?? 0;
    if (cleaning > 0) {
        alerts.push({
            key: 'cleaning',
            icon: 'pi-refresh',
            tone: 'warn',
            title: 'Mesas en limpieza',
            detail: `${cleaning} mesa(s) pendientes de liberar.`,
            actionLabel: 'Ver mesas',
            actionRoute: '/tables',
        });
    }

    if (activeOrdersCount > 0) {
        alerts.push({
            key: 'open-orders',
            icon: 'pi-clock',
            tone: 'warn',
            title: 'Comandas abiertas',
            detail: `${activeOrdersCount} orden(es) sin cerrar.`,
        });
    }

    return alerts.slice(0, 6);
}
