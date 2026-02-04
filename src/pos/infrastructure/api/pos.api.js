/**
 * POS Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo POS.
 * Maneja endpoints de ventas, tickets, productos en venta, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class PosApi {
  /**
   * Ejemplo de métodos API
   * 
   * async createSale(saleData) {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/pos/sales`, {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(saleData)
   *     });
   *     if (!response.ok) throw new Error('Failed to create sale');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('PosApi.createSale error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const posApi = new PosApi();
