/**
 * Payments Presentation - UI Constants
 *
 * Alineadas con payment.entity.js (PAYMENT_METHOD / PAYMENT_STATUS / RECEIPT_TYPE).
 * NO contienen lógica de negocio.
 */

// ── Métodos de pago ────────────────────────────────────────────────────────
export const METHOD_LABELS = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    yape: 'Yape',
    plin: 'Plin',
};

export const METHOD_COLORS = {
    cash: '#10b981',
    card: '#6366f1',
    yape: '#8b5cf6',
    plin: '#3b82f6',
};

export const METHOD_ICONS = {
    cash: 'pi-money-bill',
    card: 'pi-credit-card',
    yape: 'pi-mobile',
    plin: 'pi-send',
};

export const METHOD_FILTER_OPTIONS = [
    { key: 'all',  label: 'Todos',    icon: 'pi-list'        },
    { key: 'cash', label: 'Efectivo', icon: 'pi-money-bill'  },
    { key: 'card', label: 'Tarjeta',  icon: 'pi-credit-card' },
    { key: 'yape', label: 'Yape',     icon: 'pi-mobile'      },
    { key: 'plin', label: 'Plin',     icon: 'pi-send'        },
];

// ── Comprobantes ───────────────────────────────────────────────────────────
export const RECEIPT_LABELS = {
    nota:    'Nota de Venta',
    boleta:  'Boleta',
    factura: 'Factura',
};

export const RECEIPT_COLORS = {
    nota:    '#6b7280',
    boleta:  '#f59e0b',
    factura: '#3b82f6',
};

// ── Estados de pago ────────────────────────────────────────────────────────
export const PAYMENT_STATUS_CONFIG = {
    completed: { label: 'Completado', color: '#059669', bg: '#dcfce7', icon: 'pi-check-circle' },
    cancelled: { label: 'Cancelado',  color: '#dc2626', bg: '#fee2e2', icon: 'pi-times-circle' },
    refunded:  { label: 'Reembolsado', color: '#7c3aed', bg: '#ede9fe', icon: 'pi-replay'     },
};

// ── Mensajes de UI ─────────────────────────────────────────────────────────
export const PAYMENTS_MESSAGES = {
    PAYMENT_SUCCESS: 'Pago procesado correctamente',
    PAYMENT_ERROR:   'Error al procesar el pago',
    REFUND_SUCCESS:  'Reembolso registrado correctamente',
    REFUND_ERROR:    'Error al procesar el reembolso',
};
