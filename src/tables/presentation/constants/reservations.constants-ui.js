import { RESERVATION_STATUS } from '../../domain/models/reservation.entity.js';

export const RESERVATION_STATUS_LABELS = Object.freeze({
    [RESERVATION_STATUS.CONFIRMED]: 'Confirmada',
    [RESERVATION_STATUS.SEATED]:    'Sentada',
    [RESERVATION_STATUS.CANCELLED]: 'Cancelada',
    [RESERVATION_STATUS.NO_SHOW]:   'No show',
});

export const RESERVATION_STATUS_COLORS = Object.freeze({
    [RESERVATION_STATUS.CONFIRMED]: { text: '#5b21b6', bg: '#ede9fe', border: '#a78bfa' },
    [RESERVATION_STATUS.SEATED]:    { text: '#065f46', bg: '#d1fae5', border: '#34d399' },
    [RESERVATION_STATUS.CANCELLED]: { text: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
    [RESERVATION_STATUS.NO_SHOW]:   { text: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
});

export const RESERVATIONS_MESSAGES = Object.freeze({
    CREATE_SUCCESS:  'Reserva creada',
    CANCEL_SUCCESS:  'Reserva cancelada',
    CHECKIN_SUCCESS: 'Check-in registrado',
});

export const RESERVATION_STATUS_FILTER_OPTIONS = Object.freeze([
    { label: 'Todos los estados', value: '' },
    { label: 'Confirmada', value: RESERVATION_STATUS.CONFIRMED },
    { label: 'Sentada', value: RESERVATION_STATUS.SEATED },
    { label: 'Cancelada', value: RESERVATION_STATUS.CANCELLED },
    { label: 'No show', value: RESERVATION_STATUS.NO_SHOW },
]);

export const RESERVATION_TABLE_FILTER_OPTIONS = Object.freeze([
    { label: 'Todas las mesas', value: '' },
    { label: 'Con mesa asignada', value: 'with' },
    { label: 'Sin mesa', value: 'without' },
]);
