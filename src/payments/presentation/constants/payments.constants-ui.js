/**
 * Payments Presentation - UI Constants
 * 
 * Constantes relacionadas con la presentación del módulo Payments.
 * NO contienen lógica de negocio.
 * 
 * Ejemplos:
 * - Labels de métodos de pago
 * - Iconos
 * - Mensajes de UI
 */

export const PAYMENTS_ROUTES = {
  PROCESS: '/payments/process',
  HISTORY: '/payments/history',
};

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  DIGITAL_WALLET: 'Billetera Digital',
};

export const PAYMENTS_MESSAGES = {
  PAYMENT_SUCCESS: 'Pago procesado correctamente',
  PAYMENT_ERROR: 'Error al procesar el pago',
  REFUND_SUCCESS: 'Reembolso procesado correctamente',
};
