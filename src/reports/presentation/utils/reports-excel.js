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
