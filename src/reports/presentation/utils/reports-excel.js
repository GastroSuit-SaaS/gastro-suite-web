import { exportTableToExcel } from '../../../shared/utils/excel-export.js';

const COLLECTOR_COLUMNS = [
    { header: 'Empleado / cobrador', field: 'displayName' },
    { header: 'Pagos', field: 'paymentCount' },
    {
        header: 'Total cobrado (S/)',
        field: 'totalAmount',
        exportValue: (row) => Number(row.totalAmount ?? 0).toFixed(2),
    },
];

const PAYMENT_METHOD_COLUMNS = [
    { header: 'Método de pago', field: 'displayName' },
    { header: 'Pagos', field: 'paymentCount' },
    {
        header: 'Total (S/)',
        field: 'totalAmount',
        exportValue: (row) => Number(row.totalAmount ?? 0).toFixed(2),
    },
    {
        header: '% del total',
        field: 'percentage',
        exportValue: (row) => `${Number(row.percentage ?? 0).toFixed(2)}%`,
    },
];

function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function escapeCsv(value) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

/**
 * @param {{ title?: string, data?: { collectors?: Array<object>, totalPayments?: number, totalAmount?: number } }} report
 */
export function exportCollectorSalesReportExcel(report, options = {}) {
    const collectors = report?.data?.collectors ?? [];
    const date = new Date().toISOString().slice(0, 10);
    const filename = options.filename ?? `cobros_por_empleado_${date}`;

    exportTableToExcel({
        filename,
        sheetName: 'Cobros por empleado',
        columns: COLLECTOR_COLUMNS,
        rows: collectors,
    });
}

/**
 * @param {{ title?: string, data?: { methods?: Array<object> } }} report
 */
export function exportSalesByPaymentMethodReportExcel(report, options = {}) {
    const methods = report?.data?.methods ?? [];
    const date = new Date().toISOString().slice(0, 10);
    const filename = options.filename ?? `ventas_por_metodo_pago_${date}`;

    exportTableToExcel({
        filename,
        sheetName: 'Por método de pago',
        columns: PAYMENT_METHOD_COLUMNS,
        rows: methods,
    });
}

/**
 * @param {{ title?: string, data?: { methods?: Array<object> } }} report
 */
export function exportSalesByPaymentMethodReportCsv(report, options = {}) {
    const methods = report?.data?.methods ?? [];
    const date = new Date().toISOString().slice(0, 10);
    const filename = options.filename ?? `ventas_por_metodo_pago_${date}.csv`;

    const header = PAYMENT_METHOD_COLUMNS.map((col) => escapeCsv(col.header)).join(',');
    const lines = methods.map((row) =>
        PAYMENT_METHOD_COLUMNS.map((col) => {
            const raw = col.exportValue ? col.exportValue(row) : row[col.field];
            return escapeCsv(raw);
        }).join(','),
    );

    downloadTextFile(filename, [header, ...lines].join('\n'), 'text/csv;charset=utf-8;');
}
