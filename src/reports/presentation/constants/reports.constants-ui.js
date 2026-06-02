/**
 * Reports Presentation - UI Constants
 */

export const REPORTS_ROUTES = {
  DASHBOARD: '/reports',
  SALES: '/reports/sales',
  INVENTORY: '/reports/inventory',
  FINANCIAL: '/reports/financial',
};

export const REPORT_TYPE_LABELS = {
  DAILY_SALES: 'Ventas diarias',
  MONTHLY_SALES: 'Ventas mensuales',
  INVENTORY_STATUS: 'Estado de inventario',
  FINANCIAL: 'Resumen financiero',
  PRODUCT_MIX: 'Mix de productos',
  COLLECTOR_SALES: 'Cobros por empleado',
};

export const EXPORT_FORMAT_LABELS = {
  EXCEL: 'Excel (.xlsx)',
};

export const REPORTS_MESSAGES = {
  GENERATE_SUCCESS: 'Reporte generado correctamente',
  GENERATE_ERROR: 'Error al generar el reporte',
  EXPORT_SUCCESS: 'Reporte exportado correctamente',
  EMPLOYEE_LINK_REQUIRED: 'Debes estar vinculado como empleado para generar reportes.',
};
