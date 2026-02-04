/**
 * Dashboard Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Dashboard.
 * Maneja endpoints, requests, responses y errores HTTP.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class DashboardApi {
  /**
   * Ejemplo de método API
   * 
   * async getMetrics() {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
   *     if (!response.ok) throw new Error('Failed to fetch metrics');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('DashboardApi.getMetrics error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const dashboardApi = new DashboardApi();
