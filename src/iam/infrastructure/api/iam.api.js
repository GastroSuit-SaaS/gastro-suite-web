/**
 * IAM Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo IAM.
 * Maneja autenticación, autorización y gestión de identidad.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class IamApi {
  /**
   * Ejemplo de métodos API
   * 
   * async login(credentials) {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/auth/login`, {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(credentials)
   *     });
   *     if (!response.ok) throw new Error('Login failed');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('IamApi.login error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const iamApi = new IamApi();
