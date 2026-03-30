/**
 * Stations Presentation - UI Constants
 */

export const TICKET_STATUS_CONFIG = {
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
        label:     'Cancelado',
        color:     '#ef4444',
        bg:        '#fee2e2',
        icon:      'pi-times-circle',
        next:      null,
        nextLabel: null,
        canCancel: false,
    },
};

// Columns shown on the live kanban (active workflow only)
export const TICKET_COLUMNS = [
    { key: 'received',  label: 'Recibido',           color: '#3b82f6', bg: '#eff6ff' },
    { key: 'preparing', label: 'En Preparación',     color: '#f59e0b', bg: '#fffbeb' },
    { key: 'ready',     label: 'Listo para recoger', color: '#10b981', bg: '#f0fdf4' },
    { key: 'delivered', label: 'Entregado',           color: '#6366f1', bg: '#f5f3ff' },
];


