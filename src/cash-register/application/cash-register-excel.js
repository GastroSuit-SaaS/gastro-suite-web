import { exportMultiSheetExcel } from '../../shared/infrastructure/export/excel-export.js';
import { MOVEMENT_CATEGORY, MOVEMENT_TYPE } from '../domain/models/cash-movement.entity.js';
import {
    movementOrderLabel,
    movementPaymentMethodLabel,
    movementCollectedBy,
    movementTableContext,
    movementDescriptionText,
    movementMethodKey,
} from './cash-movement-display.js';

const TYPE_LABELS = { income: 'Ingreso', expense: 'Egreso' };
const CATEGORY_LABELS = {
    apertura: 'Apertura',
    venta: 'Venta Efectivo',
    venta_digital: 'Venta Digital',
    reembolso: 'Reembolso',
    compra: 'Compra',
    retiro: 'Retiro',
    deposito: 'Depósito',
    cierre: 'Cierre',
    PROPIA: 'Propina',
    otro: 'Otro',
};

function formatDateTime(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return String(dt);
    return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function movementToRow(mov) {
    const typeLabel = TYPE_LABELS[mov.type] ?? mov.type;
    const categoryLabel = CATEGORY_LABELS[mov.category] ?? mov.category;
    const signedAmount = mov.type === 'expense' ? -Math.abs(mov.amount) : mov.amount;

    return {
        Fecha: formatDateTime(mov.createdAt),
        Orden: movementOrderLabel(mov) || '',
        Categoría: categoryLabel,
        Método: movementPaymentMethodLabel(mov) || '',
        Detalle: movementDescriptionText(mov),
        Mesa: movementTableContext(mov) || '',
        Tipo: typeLabel,
        Monto: signedAmount,
        'Cobrado por': movementCollectedBy(mov),
        Registrado: mov.userName || '',
        'ID Pago': mov.paymentId || '',
    };
}

/**
 * @param {{ movements: object[], filename: string, summaryRows?: Array<Array<unknown>> }} options
 */
export function exportCashMovementsExcel({ movements, filename, summaryRows = null }) {
    const sheets = [];

    if (summaryRows?.length) {
        sheets.push({ name: 'Resumen', rows: summaryRows });
    }

    sheets.push({
        name: 'Movimientos',
        rows: movements.map(movementToRow),
    });

    exportMultiSheetExcel({ sheets, filename });
}

function summarizeMovements(movements) {
    const byMethod = { card: 0, yape: 0, plin: 0 };
    let cashSales = 0;
    let digital = 0;
    let tips = 0;
    let refunds = 0;
    const saleKeys = new Set();

    for (const m of movements) {
        if (m.category === MOVEMENT_CATEGORY.VENTA && m.type === MOVEMENT_TYPE.INCOME) {
            cashSales += m.amount;
        }
        if (m.category === MOVEMENT_CATEGORY.VENTA_DIGITAL) {
            digital += m.amount;
            const key = movementMethodKey(m);
            if (key in byMethod) byMethod[key] += m.amount;
        }
        if (m.category === MOVEMENT_CATEGORY.PROPIA && m.type === MOVEMENT_TYPE.INCOME) {
            tips += m.amount;
        }
        if (m.category === MOVEMENT_CATEGORY.REEMBOLSO && m.type === MOVEMENT_TYPE.EXPENSE) {
            refunds += m.amount;
        }
        if (m.category === MOVEMENT_CATEGORY.VENTA || m.category === MOVEMENT_CATEGORY.VENTA_DIGITAL) {
            if (m.saleDisplayNumber != null) saleKeys.add(`order:${m.saleDisplayNumber}`);
            else if (m.paymentId) saleKeys.add(`pay:${m.paymentId}`);
            else saleKeys.add(`mov:${m.id}`);
        }
    }

    return { cashSales, digital, byMethod, tips, refunds, salesCount: saleKeys.size };
}

/**
 * @param {object} session
 * @param {object[]} movements
 */
export function buildSessionSummaryRows(session, movements = []) {
    const fmt = (n) => Number(n ?? 0);
    const calc = summarizeMovements(movements);

    return [
        ['Turno', session?.shiftName || ''],
        ['Estado', session?.status || ''],
        ['Abierto', formatDateTime(session?.openedAt)],
        ['Cerrado', formatDateTime(session?.closedAt)],
        ['Cajero', session?.openedBy || ''],
        ['Cerrado por', session?.closedBy || ''],
        ['Monto inicial', fmt(session?.initialAmount)],
        ['Ventas efectivo', fmt(session?.cashRevenue ?? calc.cashSales)],
        ['Ventas digitales', fmt(session?.digitalRevenue ?? calc.digital)],
        ['Tarjeta', fmt(calc.byMethod.card)],
        ['Yape', fmt(calc.byMethod.yape)],
        ['Plin', fmt(calc.byMethod.plin)],
        ['Propinas', fmt(calc.tips)],
        ['Reembolsos', fmt(calc.refunds)],
        ['Ventas totales', fmt(session?.totalRevenue ?? calc.cashSales + calc.digital)],
        ['N° ventas', session?.totalSales ?? calc.salesCount],
        ['Efectivo esperado', fmt(session?.expectedCash)],
        ['Efectivo contado', fmt(session?.countedAmount)],
        ['Diferencia', fmt(session?.difference)],
        [],
    ];
}
