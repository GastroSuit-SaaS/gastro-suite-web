/**
 * Inventory Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Inventory.
 * Maneja endpoints de productos, stock, categorías, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class InventoryApi {
  /**
   * Ejemplo de métodos API
   * 
   * async getProducts() {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/inventory/products`);
   *     if (!response.ok) throw new Error('Failed to fetch products');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('InventoryApi.getProducts error:', error);
   *     throw error;
   *   }
   * }
   * 
   * async updateStock(productId, quantity) {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/inventory/products/${productId}/stock`, {
   *       method: 'PATCH',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify({ quantity })
   *     });
   *     if (!response.ok) throw new Error('Failed to update stock');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('InventoryApi.updateStock error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const inventoryApi = new InventoryApi();
