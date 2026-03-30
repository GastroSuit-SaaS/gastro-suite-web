/**
 * POS Domain - Sale Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
import { SaleItem } from './sale-item.entity.js';

export const SALE_STATUS = Object.freeze({
    ACTIVE:    'active',
    PAID:      'paid',
    CANCELLED: 'cancelled',
    PENDING:   'pending',
});

export class Sale {
    constructor({
        id        = null,
        tableId   = null,
        zoneId    = null,
        items     = [],
        subtotal  = 0,
        tax       = 0,
        discount  = 0,
        total     = 0,
        status    = SALE_STATUS.ACTIVE,
        cashierId = null,
        createdAt = null,
    } = {}) {
        this.id        = id;
        this.tableId   = tableId;
        this.zoneId    = zoneId;
        this.items     = items;
        this.subtotal  = subtotal;
        this.tax       = tax;
        this.discount  = discount;
        this.total     = total;
        this.status    = status;
        this.cashierId = cashierId;
        this.createdAt = createdAt;
    }

    // ── Getters ──────────────────────────────────────────────────────────

    get totalItems() {
        return this.items.reduce((sum, i) => sum + i.quantity, 0);
    }

    // ── Mutations ────────────────────────────────────────────────────────

    /**
     * Agrega un MenuItem a la orden.
     * Si ya existe un item sin nota para ese producto, incrementa la cantidad.
     * De lo contrario crea una nueva línea.
     */
    addItem(menuItem) {
        // Solo se puede acumular en una línea que todavía no fue enviada a cocina.
        // Si la línea ya fue enviada, se crea una nueva para que el delta llegue como ticket nuevo.
        const existing = this.items.find(
            i => i.menuItemId === menuItem.id && i.note === '' && !i.isSent
        );
        if (existing) {
            existing.quantity += 1;
            existing._recalculate();
        } else {
            this.items.push(new SaleItem({
                menuItemId:   menuItem.id,
                menuItemName: menuItem.name,
                quantity:     1,
                unitPrice:    menuItem.price,
                stationId:    menuItem.stationId   ?? null,
                stationName:  menuItem.station     ?? null,
            }));
        }
        this._recalculate();
    }

    /** Elimina una línea de la orden por su id. */
    removeItem(itemId) {
        const idx = this.items.findIndex(i => i.id === itemId);
        if (idx !== -1) this.items.splice(idx, 1);
        this._recalculate();
    }

    /** Actualiza la cantidad de una línea. Si qty <= 0 elimina la línea. */
    updateQuantity(itemId, qty) {
        if (qty <= 0) { this.removeItem(itemId); return; }
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        item.quantity = qty;
        item._recalculate();
        this._recalculate();
    }

    /** Actualiza la nota de una línea. */
    updateNote(itemId, note) {
        const item = this.items.find(i => i.id === itemId);
        if (item) item.note = note;
    }

    /**
     * Aplica un descuento a una línea y recalcula.
     * @param {number}          itemId
     * @param {'pct'|'fixed'}   type   - 'pct' = porcentaje, 'fixed' = monto fijo
     * @param {number}          value  - % (0-100) o monto en soles (≥0)
     */
    updateDiscount(itemId, type, value) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        item.discountType  = type  === 'fixed' ? 'fixed' : 'pct';
        item.discountValue = Math.max(0, Number(value) || 0);
        if (type === 'pct') item.discountValue = Math.min(100, item.discountValue);
        item._recalculate();
        this._recalculate();
    }

    /**
     * Aplica o elimina un descuento a nivel de orden completa.
     * @param {'fixed'|'pct'} type  - 'fixed' = monto fijo, 'pct' = porcentaje aplicado sobre subtotal
     * @param {number}        value - Monto fijo (≥0) o porcentaje (0-100)
     */
    updateOrderDiscount(type, value) {
        const numericValue = Math.max(0, Number(value) || 0);
        if (type === 'fixed') {
            this.discount = numericValue;
        } else {
            const pct      = Math.min(100, numericValue);
            this.discount  = parseFloat((this.subtotal * pct / 100).toFixed(2));
        }
        this._recalculate();
    }

    /** Elimina el descuento a nivel de orden. */
    clearOrderDiscount() {
        this.discount = 0;
        this._recalculate();
    }

    /** Duplica una línea (útil para separar customizaciones). */
    duplicateItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        this.items.push(new SaleItem({
            menuItemId:   item.menuItemId,
            menuItemName: item.menuItemName,
            quantity:     1,
            unitPrice:    item.unitPrice,
            note:         '',
        }));
        this._recalculate();
    }

    // ── Private ──────────────────────────────────────────────────────────

    _recalculate() {
        this.subtotal = parseFloat(
            this.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
        );
        this.tax   = parseFloat((this.subtotal * 0.18).toFixed(2));
        this.total = parseFloat((this.subtotal + this.tax - this.discount).toFixed(2));
    }
}

