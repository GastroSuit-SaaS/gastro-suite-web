/**
 * Tables Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Tables.
 * Maneja endpoints de mesas, reservas, asignaciones, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class TablesApi {
  /**
   * Ejemplo de métodos API
   * 
   * async getTables() {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/tables`);
   *     if (!response.ok) throw new Error('Failed to fetch tables');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('TablesApi.getTables error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const tablesApi = new TablesApi();
