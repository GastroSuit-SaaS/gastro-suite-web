/**
 * Dashboard Domain - DashboardMetric Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
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
