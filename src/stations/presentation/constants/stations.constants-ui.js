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
    },
    preparing: {
        label:     'En Preparación',
        color:     '#f59e0b',
        bg:        '#fef3c7',
        icon:      'pi-clock',
        next:      'ready',
        nextLabel: 'Marcar como Listo',
    },
    ready: {
        label:     'Listo',
        color:     '#10b981',
        bg:        '#d1fae5',
        icon:      'pi-check-circle',
        next:      null,
        nextLabel: null,
    },
};

export const TICKET_COLUMNS = [
    { key: 'received',  label: 'Recibido',       color: '#3b82f6', bg: '#eff6ff' },
    { key: 'preparing', label: 'En Preparación', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'ready',     label: 'Listo',           color: '#10b981', bg: '#f0fdf4' },
];


