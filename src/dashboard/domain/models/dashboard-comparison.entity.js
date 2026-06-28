/**
 * GET /branches/{branchId}/dashboard/comparison
 */
export const COMPARISON_PERIODS = Object.freeze({
    YESTERDAY: 'yesterday',
    LAST_WEEK: 'last_week',
    LAST_MONTH: 'last_month',
});

/** Valor interno del desplegable cuando no hay comparación (no enviar al API). */
export const COMPARISON_PERIOD_NONE = 'none';

export const COMPARISON_PERIOD_OPTIONS = Object.freeze([
    { value: COMPARISON_PERIODS.YESTERDAY, label: 'Ayer' },
    { value: COMPARISON_PERIODS.LAST_WEEK, label: 'Semana pasada' },
    { value: COMPARISON_PERIODS.LAST_MONTH, label: 'Mes pasado' },
]);

/** Opciones del desplegable en el panel principal (incluye vista sin comparar). */
export const DASHBOARD_COMPARE_OPTIONS = Object.freeze([
    { value: COMPARISON_PERIOD_NONE, label: 'Sin comparar' },
    ...COMPARISON_PERIOD_OPTIONS,
]);

export class MetricDelta {
    constructor({ current = 0, previous = 0, changePercent = 0 } = {}) {
        this.current = Number(current ?? 0);
        this.previous = Number(previous ?? 0);
        this.changePercent = Number(changePercent ?? 0);
    }
}

export class DashboardComparison {
    constructor({
        businessDate = null,
        compareWith = COMPARISON_PERIODS.YESTERDAY,
        compareDate = null,
        timezone = 'America/Lima',
        revenue = {},
        paymentCount = {},
        avgTicket = {},
        covers = {},
        cancellations = {},
        hourlyCurrent = [],
        hourlyPrevious = [],
        channels = [],
        topItems = [],
        summary = {},
    } = {}) {
        this.businessDate = businessDate;
        this.compareWith = compareWith;
        this.compareDate = compareDate;
        this.timezone = timezone;
        this.revenue = new MetricDelta(revenue);
        this.paymentCount = new MetricDelta(paymentCount);
        this.avgTicket = new MetricDelta(avgTicket);
        this.covers = new MetricDelta(covers);
        this.cancellations = new MetricDelta(cancellations);
        this.hourlyCurrent = hourlyCurrent.map(normalizeHourlyPoint);
        this.hourlyPrevious = hourlyPrevious.map(normalizeHourlyPoint);
        this.channels = channels.map(normalizeChannel);
        this.topItems = topItems.map(normalizeTopItem);
        this.summary = {
            headline: summary.headline ?? '',
            revenueChangePercent: Number(summary.revenueChangePercent ?? 0),
            bestHour: {
                hour: Number(summary.bestHour?.hour ?? 0),
                label: summary.bestHour?.label ?? '',
                amount: Number(summary.bestHour?.amount ?? 0),
            },
            topProduct: {
                name: summary.topProduct?.name ?? '—',
                quantity: Number(summary.topProduct?.quantity ?? 0),
            },
            topChannel: {
                key: summary.topChannel?.key ?? 'salon',
                label: summary.topChannel?.label ?? 'Salón',
                percent: Number(summary.topChannel?.percent ?? 0),
            },
        };
    }
}

function normalizeHourlyPoint(point) {
    return {
        hour: Number(point.hour ?? 0),
        amount: Number(point.amount ?? 0),
    };
}

function normalizeChannel(row) {
    return {
        key: row.key ?? '',
        label: row.label ?? row.key ?? '',
        current: Number(row.current ?? 0),
        previous: Number(row.previous ?? 0),
        changePercent: Number(row.changePercent ?? 0),
    };
}

function normalizeTopItem(row) {
    return {
        itemId: row.itemId ?? null,
        name: row.name ?? 'Producto',
        currentQuantity: Number(row.currentQuantity ?? 0),
        previousQuantity: Number(row.previousQuantity ?? 0),
        changePercent: Number(row.changePercent ?? 0),
    };
}
