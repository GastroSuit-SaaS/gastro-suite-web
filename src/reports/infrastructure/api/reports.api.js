/**
 * Reports Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Reports.
 * Maneja endpoints de reportes, analytics, exportación, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ReportsApi {
  /**
   * Ejemplo de métodos API
   * 
   * async generateReport(reportType, filters) {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/reports/generate`, {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify({ type: reportType, filters })
   *     });
   *     if (!response.ok) throw new Error('Failed to generate report');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('ReportsApi.generateReport error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const reportsApi = new ReportsApi();
