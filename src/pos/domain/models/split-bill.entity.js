/**
 * POS Domain - SplitBill Value Object
 *
 * Representa una sub-cuenta dentro de una división de cuenta.
 * Cada SplitBill agrupa un subconjunto de ítems (o un monto fijo
 * en modo partes iguales) y se paga de forma independiente.
 */
import { SALE_TAX_RATE } from './sale.entity.js';

export const SPLIT_MODE = Object.freeze({
    EQUAL: 'equal',
    BY_ITEMS: 'by_items',
});

export class SplitBill {
    constructor({
        id       = null,
        label    = '',
        items    = [],
        subtotal = 0,
        tax      = 0,
        total    = 0,
        isPaid   = false,
        method   = null,
    } = {}) {
        this.id       = id ?? crypto.randomUUID();
        this.label    = label;
        this.items    = items;
        this.subtotal = subtotal;
        this.tax      = tax;
        this.total    = total;
        this.isPaid   = isPaid;
        this.method   = method;
    }

    markPaid(method) {
        this.isPaid = true;
        this.method = method;
    }

    /**
     * Recalculates totals from items list.
     * Used in BY_ITEMS mode.
     */
    recalculate() {
        const itemsTotal = parseFloat(
            this.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
        );
        this.total    = itemsTotal;
        this.subtotal = parseFloat((this.total / (1 + SALE_TAX_RATE)).toFixed(2));
        this.tax      = parseFloat((this.total - this.subtotal).toFixed(2));
    }

    /**
     * Sets fixed totals (for EQUAL mode).
     */
    setFixedTotal(total) {
        this.total    = parseFloat(total.toFixed(2));
        this.subtotal = parseFloat((this.total / (1 + SALE_TAX_RATE)).toFixed(2));
        this.tax      = parseFloat((this.total - this.subtotal).toFixed(2));
    }

    /**
     * Creates N equal splits from a sale.
     */
    static createEqualSplits(sale, count) {
        const perPerson = parseFloat((sale.total / count).toFixed(2));
        const remainder = parseFloat((sale.total - perPerson * count).toFixed(2));

        return Array.from({ length: count }, (_, i) => {
            const amount = i === 0 ? perPerson + remainder : perPerson;
            const split = new SplitBill({
                label: `Persona ${i + 1}`,
            });
            split.setFixedTotal(amount);
            return split;
        });
    }

    /**
     * Creates empty splits for BY_ITEMS mode.
     * Items are assigned manually later.
     */
    static createItemSplits(count) {
        return Array.from({ length: count }, (_, i) =>
            new SplitBill({ label: `Cuenta ${i + 1}`, items: [] })
        );
    }
}
