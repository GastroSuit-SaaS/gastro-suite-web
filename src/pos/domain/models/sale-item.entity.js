/**
 * POS Domain - SaleItem Entity
 *
 * Representa una línea dentro de una orden (Sale).
 * Objeto de dominio puro — sin dependencias Vue, sin HTTP.
 */

let _nextId = 1;

export class SaleItem {
    constructor({
        id              = null,
        menuItemId      = null,
        menuItemName    = '',
        quantity        = 1,
        unitPrice       = 0,
        note            = '',
        discountType    = 'pct',   // 'pct' | 'fixed'
        discountValue   = 0,       // % o monto fijo en soles
    } = {}) {
        this.id            = id ?? _nextId++;
        this.menuItemId    = menuItemId;
        this.menuItemName  = menuItemName;
        this.quantity      = quantity;
        this.unitPrice     = unitPrice;
        this.note          = note;
        this.discountType  = discountType;
        this.discountValue = discountValue;
        this.subtotal      = 0;
        this._recalculate();
    }

    /** Retorna el monto del descuento ya calculado. */
    get discountAmount() {
        const base = this.quantity * this.unitPrice;
        if (this.discountType === 'pct') {
            return parseFloat((base * (this.discountValue / 100)).toFixed(2));
        }
        // fixed: cap al valor de la línea
        return parseFloat(Math.min(this.discountValue, base).toFixed(2));
    }

    /** Recalcula el subtotal aplicando el descuento activo. */
    _recalculate() {
        const base = this.quantity * this.unitPrice;
        this.subtotal = parseFloat((base - this.discountAmount).toFixed(2));
    }
}
