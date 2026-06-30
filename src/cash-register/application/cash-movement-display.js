import { formatSaleOrderHash } from '../../shared/domain/order-display.js';
import { formatCashMovementDescription } from '../../shared/domain/cash-movement-display.js';
import { MOVEMENT_CATEGORY } from '../domain/models/cash-movement.entity.js';

const METHOD_LABELS = Object.freeze({
    cash: 'Efectivo',
    card: 'Tarjeta',
    yape: 'Yape',
    plin: 'Plin',
});

const METHOD_FROM_DESCRIPTION = [
    { pattern: /—\s*Efectivo\s*$/i, key: 'cash' },
    { pattern: /—\s*Card\s*$/i, key: 'card' },
    { pattern: /—\s*Tarjeta\s*$/i, key: 'card' },
    { pattern: /—\s*Yape\s*$/i, key: 'yape' },
    { pattern: /—\s*Plin\s*$/i, key: 'plin' },
];

const SALE_CATEGORIES = new Set([
    MOVEMENT_CATEGORY.VENTA,
    MOVEMENT_CATEGORY.VENTA_DIGITAL,
]);

/**
 * @param {string|null|undefined} description
 */
function orderFromDescription(description) {
    if (!description) return null;
    const match = String(description).match(/Orden\s+#(\d+)/i);
    return match ? Number(match[1]) : null;
}

function isRedundantSaleDescription(desc) {
    if (!desc) return true;
    return /^(Venta|Propina)\s*(Orden\s+#\d+)?\s*—\s*(Efectivo|Card|Tarjeta|Yape|Plin|Cash)\s*$/i.test(desc.trim());
}

/**
 * @param {import('../domain/models/cash-movement.entity.js').CashMovement} mov
 */
export function movementOrderLabel(mov) {
    if (mov?.saleDisplayNumber != null && mov.saleDisplayNumber !== '') {
        return formatSaleOrderHash(mov.saleDisplayNumber);
    }
    const fromDesc = orderFromDescription(mov?.description);
    if (fromDesc != null) return formatSaleOrderHash(fromDesc);
    if (SALE_CATEGORIES.has(mov?.category) || mov?.category === MOVEMENT_CATEGORY.REEMBOLSO || mov?.category === MOVEMENT_CATEGORY.PROPIA) {
        return '—';
    }
    return '';
}

/**
 * @param {import('../domain/models/cash-movement.entity.js').CashMovement} mov
 */
export function movementMethodKey(mov) {
    const raw = mov?.paymentMethod;
    if (raw) {
        const key = String(raw).toLowerCase();
        if (['cash', 'card', 'yape', 'plin'].includes(key)) return key;
    }
    const desc = mov?.description ?? '';
    for (const { pattern, key } of METHOD_FROM_DESCRIPTION) {
        if (pattern.test(desc)) return key;
    }
    if (mov?.category === MOVEMENT_CATEGORY.VENTA) return 'cash';
    return '';
}

/**
 * @param {import('../domain/models/cash-movement.entity.js').CashMovement} mov
 */
export function movementPaymentMethodLabel(mov) {
    const raw = mov?.paymentMethod;
    if (raw) {
        const key = String(raw).toLowerCase();
        return METHOD_LABELS[key] ?? raw;
    }
    const desc = mov?.description ?? '';
    for (const { pattern, key } of METHOD_FROM_DESCRIPTION) {
        if (pattern.test(desc)) return METHOD_LABELS[key];
    }
    return '';
}

/**
 * @param {import('../domain/models/cash-movement.entity.js').CashMovement} mov
 */
export function movementCollectedBy(mov) {
    if (mov?.collectedByDisplayName?.trim()) return mov.collectedByDisplayName.trim();
    return mov?.userName || '—';
}

/**
 * @param {import('../domain/models/cash-movement.entity.js').CashMovement} mov
 */
export function movementTableContext(mov) {
    if (!mov?.tableNumber) return '';
    const zone = mov.zoneName?.trim();
    return zone ? `Mesa ${mov.tableNumber} · ${zone}` : `Mesa ${mov.tableNumber}`;
}

/**
 * Texto de la columna Descripción: contexto operativo sin repetir orden ni método (tienen columna propia).
 * @param {import('../domain/models/cash-movement.entity.js').CashMovement} mov
 */
export function movementDescriptionText(mov) {
    const legacy = formatCashMovementDescription(mov?.description);
    const table = movementTableContext(mov);
    const orderNum = mov?.saleDisplayNumber ?? orderFromDescription(legacy);
    const cat = mov?.category;

    if (cat === MOVEMENT_CATEGORY.APERTURA) {
        return legacy || 'Apertura de turno';
    }

    if (cat === MOVEMENT_CATEGORY.PROPIA) {
        const base = orderNum ? `Propina Orden #${orderNum}` : (legacy.replace(/^Propina\s*/i, '').trim() || 'Propina');
        if (table && !base.includes(table)) return `${base} · ${table}`;
        return base;
    }

    if (cat === MOVEMENT_CATEGORY.REEMBOLSO) {
        let base = orderNum ? `Reembolso Orden #${orderNum}` : (legacy || 'Reembolso');
        const reason = legacy.replace(/^Reembolso\s*(Orden\s+#\d+)?\s*—?\s*/i, '').trim();
        if (reason && reason !== base && !reason.match(/^Reembolso/i)) {
            base = `${base} — ${reason}`;
        }
        return base;
    }

    if (SALE_CATEGORIES.has(cat)) {
        if (table) return table;
        if (orderNum) return `Cobro en salón · Orden #${orderNum}`;
        if (!isRedundantSaleDescription(legacy)) return legacy;
        return 'Cobro de venta';
    }

    return legacy || '—';
}

/**
 * @param {import('../domain/models/cash-movement.entity.js').CashMovement} mov
 */
export function canDeleteMovement(mov) {
    if (!mov) return false;
    if (mov.category === MOVEMENT_CATEGORY.APERTURA) return false;
    if (mov.isLinkedToPayment) return false;
    return true;
}
