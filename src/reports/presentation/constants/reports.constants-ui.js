/**
 * Reports Presentation - UI Constants
 * 
 * Constantes relacionadas con la presentación del módulo Reports.
 * NO contienen lógica de negocio.
 * 
 * Ejemplos:
 * - Labels de tipos de reporte
 * - Configuración de gráficos
 * - Formatos de exportación
 */

export const REPORTS_ROUTES = {
  DASHBOARD: '/reports',
  SALES: '/reports/sales',
  INVENTORY: '/reports/inventory',
  FINANCIAL: '/reports/financial',
};

export const REPORT_TYPE_LABELS = {
  DAILY_SALES: 'Ventas Diarias',
  MONTHLY_SALES: 'Ventas Mensuales',
  INVENTORY_STATUS: 'Estado de Inventario',
  FINANCIAL_SUMMARY: 'Resumen Financiero',
};

export const EXPORT_FORMAT_LABELS = {
  PDF: 'PDF',
  EXCEL: 'Excel',
  CSV: 'CSV',
};

export const REPORTS_MESSAGES = {
  GENERATE_SUCCESS: 'Reporte generado correctamente',
  GENERATE_ERROR: 'Error al generar el reporte',
  EXPORT_SUCCESS: 'Reporte exportado correctamente',
};
