/**
 * Reports Domain - Report Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */

export const REPORT_TYPE = Object.freeze({
    DAILY_SALES:      'daily_sales',
    MONTHLY_SALES:    'monthly_sales',
    INVENTORY_STATUS: 'inventory_status',
    FINANCIAL:        'financial',
    PRODUCT_MIX:      'product_mix',
});

export const REPORT_STATUS = Object.freeze({
    PENDING:   'pending',
    GENERATED: 'generated',
    FAILED:    'failed',
});

export const EXPORT_FORMAT = Object.freeze({
    PDF:   'pdf',
    EXCEL: 'excel',
    CSV:   'csv',
});

export class Report {
    constructor({
        id           = null,
        type         = '',
        title        = '',
        status       = REPORT_STATUS.PENDING,
        period       = null,
        dateFrom     = null,
        dateTo       = null,
        filters      = {},
        exportFormat = EXPORT_FORMAT.PDF,
        generatedBy  = null,
        generatedAt  = null,
        data         = null,
        sucursalId   = null,
    } = {}) {
        this.id           = id;
        this.type         = type;
        this.title        = title;
        this.status       = status;
        this.period       = period;
        this.dateFrom     = dateFrom;
        this.dateTo       = dateTo;
        this.filters      = filters;
        this.exportFormat = exportFormat;
        this.generatedBy  = generatedBy;
        this.generatedAt  = generatedAt;
        this.data         = data;
        this.sucursalId   = sucursalId;
    }

    get isGenerated() {
        return this.status === REPORT_STATUS.GENERATED;
    }

    get isFailed() {
        return this.status === REPORT_STATUS.FAILED;
    }
}
