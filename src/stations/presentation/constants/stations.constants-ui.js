/**
 * Stations Presentation - UI Constants
 */

export const TICKET_STATUS_CONFIG = {
    direct: {
        label:     'Entrega directa',
        color:     '#0d9488',
        bg:        '#ccfbf1',
        icon:      'pi-shopping-bag',
        next:      null,
        nextLabel: null,
        canCancel: false,
    },
    pending: {
        label:     'Sin enviar',
        color:     '#6b7280',
        bg:        '#f3f4f6',
        icon:      'pi-clock',
        next:      null,
        nextLabel: null,
        canCancel: false,
    },
    sent: {
        label:     'Enviado',
        color:     '#64748b',
        bg:        '#f1f5f9',
        icon:      'pi-send',
        next:      null,
        nextLabel: null,
        canCancel: false,
    },
    mixed: {
        label:     'Estados mixtos',
        color:     '#8b5cf6',
        bg:        '#ede9fe',
        icon:      'pi-sliders-h',
        next:      null,
        nextLabel: null,
        canCancel: false,
    },
    received: {
        label:     'Recibido',
        color:     '#3b82f6',
        bg:        '#dbeafe',
        icon:      'pi-inbox',
        next:      'preparing',
        nextLabel: 'Iniciar Preparación',
        canCancel: true,
    },
    preparing: {
        label:     'En Preparación',
        color:     '#f59e0b',
        bg:        '#fef3c7',
        icon:      'pi-clock',
        next:      'ready',
        nextLabel: 'Marcar como Listo',
        canCancel: true,
    },
    ready: {
        label:     'Listo para recoger',
        color:     '#10b981',
        bg:        '#d1fae5',
        icon:      'pi-check-circle',
        next:      'delivered',
        nextLabel: 'Confirmar Entrega',
        canCancel: false,
    },
    delivered: {
        label:     'Entregado',
        color:     '#6366f1',
        bg:        '#ede9fe',
        icon:      'pi-user',
        next:      null,
        nextLabel: null,
        canCancel: false,
    },
    cancelled: {
        label:     'Cancelado en cocina',
        color:     '#ef4444',
        bg:        '#fee2e2',
        icon:      'pi-times-circle',
        next:      null,
        nextLabel: null,
        canCancel: false,
    },
};

// Columnas del kanban en vivo (sin Entregado: pasa al historial en segundos)
export const TICKET_COLUMNS = [
    { key: 'received',  label: 'Recibido',           color: '#3b82f6', bg: '#eff6ff' },
    { key: 'preparing', label: 'En Preparación',     color: '#f59e0b', bg: '#fffbeb' },
    { key: 'ready',     label: 'Listo para recoger', color: '#10b981', bg: '#f0fdf4' },
];


