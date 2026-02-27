/**
 * Reports Domain - Report Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class Report {
    constructor({
        id          = null,
        type        = '',
        title       = '',
        period      = null,
        generatedAt = null,
        data        = null,
    } = {}) {
        this.id          = id;
        this.type        = type;
        this.title       = title;
        this.period      = period;
        this.generatedAt = generatedAt;
        this.data        = data;
        // TODO: extend with additional domain fields (filters, exportFormat, etc.)
    }
}
