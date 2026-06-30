import { exportTableToExcel } from '../../shared/infrastructure/export/excel-export.js';
import { formatSaleOrderLabel } from '../../shared/domain/order-display.js';
import { paymentNetCollected } from '../domain/payment-net.js';

const METHOD_LABELS = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    yape: 'Yape',
    plin: 'Plin',
};

const RECEIPT_LABELS = {
    nota: 'Nota de Venta',
    boleta: 'Boleta',
    factura: 'Factura',
};

const STATUS_LABELS = {
    completed: 'Completado',
    cancelled: 'Cancelado',
    partially_refunded: 'Reemb. parcial',
    refunded: 'Reembolsado',
};

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
    { header: 'Estado', field: 'status', exportValue: (p) => STATUS_LABELS[p.status] ?? p.status },
    { header: 'Cobrado por', field: 'collectedByDisplayName' },
    { header: 'Nota', field: 'note' },
];

/**
 * @param {import('../domain/models/payment.entity.js').Payment[]} payments
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
