import { COMPARISON_PERIOD_OPTIONS } from '../../domain/models/dashboard-comparison.entity.js';

export const COMPARISON_UI = Object.freeze({
    TITLE: 'Comparación operativa',
    SUBTITLE: 'Analiza el rendimiento del día frente a un periodo anterior',
    BACK: 'Volver al dashboard',
    LOADING: 'Calculando comparativa...',
    ERROR: 'No se pudo cargar la comparativa',
    CURRENT_LABEL: 'Hoy',
    PREVIOUS_LABELS: Object.freeze({
        yesterday: 'Ayer',
        last_week: 'Sem. pasada',
        last_month: 'Mes pasado',
    }),
    KPI: Object.freeze({
        REVENUE: 'Ventas totales',
        ORDERS: 'Pedidos',
        AVG_TICKET: 'Ticket promedio',
        COVERS: 'Comensales est.',
        CANCELLATIONS: 'Cancelaciones',
    }),
    SECTIONS: Object.freeze({
        SALES_TREND: 'Ventas totales',
        CHANNELS: 'Ventas por canal',
        SUMMARY: 'Resumen del día',
        TOP_PRODUCTS: 'Productos más vendidos',
    }),
});

export function getComparisonPeriodLabel(value) {
    return COMPARISON_PERIOD_OPTIONS.find((o) => o.value === value)?.label ?? 'Ayer';
}

export function getComparisonTitle(compareWith) {
    const label = getComparisonPeriodLabel(compareWith).toLowerCase();
    return `Comparación con ${label}`;
}

export function formatDeltaBadge(changePercent, { invert = false } = {}) {
    const value = Number(changePercent ?? 0);
    const effective = invert ? -value : value;
    const sign = effective > 0 ? '+' : '';
    return `${sign}${effective.toFixed(1)}%`;
}

export function deltaTone(changePercent, { invert = false } = {}) {
    const value = Number(changePercent ?? 0);
    const effective = invert ? -value : value;
    if (effective > 0) return 'up';
    if (effective < 0) return 'down';
    return 'neutral';
}

export function formatCompareDate(isoDate) {
    if (!isoDate) return '';
    try {
        return new Date(`${isoDate}T12:00:00`).toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'long',
        });
    } catch {
        return isoDate;
    }
}

export function buildDualChartPaths(currentSeries = [], previousSeries = []) {
    const width = 100;
    const height = 40;
    const max = Math.max(
        ...currentSeries.map((p) => p.amount),
        ...previousSeries.map((p) => p.amount),
        1,
    );
    const step = width / Math.max(currentSeries.length - 1, 1);

    const toPath = (series) => series.map((point, index) => {
        const x = index * step;
        const y = height - (point.amount / max) * height;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');

    return {
        currentPath: toPath(currentSeries),
        previousPath: toPath(previousSeries),
        maxAmount: max,
    };
}
