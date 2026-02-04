/**
 * Users Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Users.
 * Maneja endpoints de usuarios, perfiles, roles, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class UsersApi {
  /**
   * Ejemplo de métodos API
   * 
   * async getUsers() {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/users`);
   *     if (!response.ok) throw new Error('Failed to fetch users');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('UsersApi.getUsers error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const usersApi = new UsersApi();
