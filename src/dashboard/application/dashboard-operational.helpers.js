import {
    PAYMENT_METHOD_KEYS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_METHOD_ICONS,
} from '../domain/dashboard-payment-methods.js';

export function buildPaymentMethodRows(byMethod, revenue) {
    return PAYMENT_METHOD_KEYS
        .map((method) => ({
            method,
            label: PAYMENT_METHOD_LABELS[method] ?? method,
            icon: PAYMENT_METHOD_ICONS[method] ?? 'pi-wallet',
            total: Number(byMethod?.[method] ?? 0),
        }))
        .filter((row) => row.total > 0)
        .sort((a, b) => b.total - a.total)
        .map((row) => ({
            ...row,
            share: revenue > 0 ? (row.total / revenue) * 100 : 0,
        }));
}

export function buildOperationalAlerts(metrics) {
    if (!metrics) return [];
    const alerts = [];
    if (!metrics.cashRegister.open) {
        alerts.push({
            severity: 'warn',
            icon: 'pi-wallet',
            message: 'No hay turno de caja abierto. Abre caja antes de cobrar en efectivo.',
        });
    }
    if (metrics.inventory.lowStockCount > 0) {
        alerts.push({
            severity: 'error',
            icon: 'pi-exclamation-triangle',
            message: `${metrics.inventory.lowStockCount} producto(s) de inventario en o bajo stock mínimo.`,
        });
    }
    if (metrics.kitchen.ready > 3) {
        alerts.push({
            severity: 'info',
            icon: 'pi-bell',
            message: `${metrics.kitchen.ready} pedido(s) listos en pass — priorizar entrega a mesa.`,
        });
    }
    if (metrics.diningRoom.activeOrders > 0 && metrics.kitchen.received + metrics.kitchen.preparing === 0) {
        alerts.push({
            severity: 'info',
            icon: 'pi-send',
            message: 'Hay comandas abiertas sin tickets en cocina. Revisa despacho al pass.',
        });
    }
    return alerts;
}
