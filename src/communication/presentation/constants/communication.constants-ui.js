export const NOTIFICATION_STATUS = Object.freeze({
    UNREAD: 'UNREAD',
    READ: 'READ',
});

export const COMMUNICATION_MESSAGES = Object.freeze({
    PANEL_TITLE: 'Notificaciones',
    EMPTY: 'No tienes notificaciones.',
    MARK_ALL: 'Marcar todas como leídas',
    LOADING: 'Cargando…',
    ERROR: 'No se pudieron cargar las notificaciones.',
});

export function formatNotificationDate(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) {
        return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}
