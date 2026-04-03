/**
 * Dashboard Domain - DashboardMetric Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 *
 * NOTA: Actualmente el dashboard agrega datos de sub-stores (payments, pos, tables, stations).
 * Esta entidad está reservada para cuando el backend provea un endpoint dedicado
 * GET /dashboard/metrics que devuelva métricas pre-calculadas.
 */
export class DashboardMetric {
    constructor({
        id       = null,
        label    = '',
        value    = 0,
        unit     = '',
        period   = null,
    } = {}) {
        this.id     = id;
        this.label  = label;
        this.value  = value;
        this.unit   = unit;
        this.period = period;
        // TODO: extend with additional domain fields as needed
    }
}
