/**
 * Payments Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Payments.
 * Maneja endpoints de pagos, métodos de pago, transacciones, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class PaymentsApi {
  /**
   * Ejemplo de métodos API
   * 
   * async processPayment(paymentData) {
   *   try {
   *     const response = await fetch(`${API_BASE_URL}/payments/process`, {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(paymentData)
   *     });
   *     if (!response.ok) throw new Error('Payment processing failed');
   *     return await response.json();
   *   } catch (error) {
   *     console.error('PaymentsApi.processPayment error:', error);
   *     throw error;
   *   }
   * }
   */
}

export const paymentsApi = new PaymentsApi();
