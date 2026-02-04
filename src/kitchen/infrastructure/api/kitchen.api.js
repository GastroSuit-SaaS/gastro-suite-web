/**
 * Kitchen Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Kitchen.
 * Maneja endpoints de órdenes, preparación, estaciones, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class KitchenApi {
  /**
   * Ejemplo de métodos API
   * 
   * async getOrders() {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/kitchen/orders`);
   *     if (!response.ok) throw new Error('Failed to fetch orders');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('KitchenApi.getOrders error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const kitchenApi = new KitchenApi();
