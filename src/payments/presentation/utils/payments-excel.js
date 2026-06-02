import { exportTableToExcel } from '../../../shared/utils/excel-export.js';
import { formatSaleOrderLabel } from '../../../shared/utils/order-display.js';
import { METHOD_LABELS, RECEIPT_LABELS } from '../constants/payments.constants-ui.js';
import { PAYMENT_STATUS_CONFIG } from '../constants/payments.constants-ui.js';
import { paymentNetCollected } from '../../domain/payment-net.js';

function formatDateTime(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const COLUMNS = [
    { header: 'Fecha', field: 'processedAt', exportValue: (p) => formatDateTime(p.processedAt) },
    { header: 'Orden', field: 'saleDisplayNumber', exportValue: (p) => formatSaleOrderLabel(p.saleDisplayNumber) },
    { header: 'Mesa', field: 'tableNumber', exportValue: (p) => (p.tableNumber ? `Mesa ${p.tableNumber}` : '') },
    { header: 'Zona', field: 'zoneName' },
    { header: 'Método', field: 'method', exportValue: (p) => METHOD_LABELS[p.method] ?? p.method },
    { header: 'Comprobante', field: 'receiptType', exportValue: (p) => RECEIPT_LABELS[p.receiptType] ?? p.receiptType },
    { header: 'Subtotal', field: 'subtotal' },
    { header: 'IGV', field: 'tax' },
    { header: 'Descuento', field: 'discount' },
    { header: 'Propina', field: 'tipAmount' },
    { header: 'Total', field: 'total' },
    { header: 'Reembolsado', field: 'refundedAmount' },
    { header: 'Neto cobrado', field: 'netCollected', exportValue: (p) => paymentNetCollected(p) },
    { header: 'Estado', field: 'status', exportValue: (p) => PAYMENT_STATUS_CONFIG[p.status]?.label ?? p.status },
    { header: 'Cobrado por', field: 'collectedByDisplayName' },
    { header: 'Nota', field: 'note' },
];

/**
 * @param {import('../../domain/models/payment.entity.js').Payment[]} payments
 * @param {{ filename?: string }} [options]
 */
export function exportPaymentsExcel(payments, options = {}) {
    const date = new Date().toISOString().slice(0, 10);
    const filename = options.filename ?? `pagos_${date}`;
    exportTableToExcel({
        filename,
        sheetName: 'Pagos',
        columns: COLUMNS,
        rows: payments,
    });
}
