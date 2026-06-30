export const NOTIFICATION_STATUS = Object.freeze({
    UNREAD: 'UNREAD',
    READ: 'READ',
});

export const NOTIFICATION_FILTER = Object.freeze({
    ALL: 'all',
    UNREAD: 'unread',
});

export const COMMUNICATION_MESSAGES = Object.freeze({
    PANEL_TITLE: 'Notificaciones',
    FILTER_ALL: 'Todas',
    FILTER_UNREAD: 'No leídas',
    SECTION_NEW: 'Nuevas',
    SECTION_TODAY: 'Hoy',
    SECTION_EARLIER: 'Anteriores',
    EMPTY: 'No tienes notificaciones.',
    EMPTY_UNREAD: 'No tienes notificaciones sin leer.',
    MARK_ALL: 'Marcar todas como leídas',
    MARK_READ: 'Marcar como leída',
    MARK_UNREAD: 'Marcar como no leída',
    DELETE: 'Eliminar',
    DELETE_SELECTED: 'Eliminar seleccionadas',
    DELETE_ALL: 'Eliminar todas',
    SELECT_ALL: 'Seleccionar todas',
    DESELECT_ALL: 'Deseleccionar todas',
    MANAGE: 'Gestionar',
    DONE: 'Listo',
    SELECTED_COUNT: (n) => `${n} seleccionada${n === 1 ? '' : 's'}`,
    SHOW_MORE: 'Ver notificaciones anteriores',
    LOADING_MORE: 'Cargando…',
    DELETE_CONFIRM_HEADER: 'Eliminar notificación',
    DELETE_CONFIRM_MESSAGE: '¿Eliminar esta notificación? Esta acción no se puede deshacer.',
    DELETE_SELECTED_CONFIRM_HEADER: 'Eliminar notificaciones',
    DELETE_SELECTED_CONFIRM_MESSAGE: (n) => `¿Eliminar ${n} notificación${n === 1 ? '' : 'es'} seleccionada${n === 1 ? '' : 's'}? Esta acción no se puede deshacer.`,
    DELETE_ALL_CONFIRM_HEADER: 'Eliminar todas las notificaciones',
    DELETE_ALL_CONFIRM_MESSAGE: '¿Eliminar todas tus notificaciones? Esta acción no se puede deshacer.',
    LOADING: 'Cargando…',
    ERROR: 'No se pudieron cargar las notificaciones.',
});

/** Icono y color según el contenido (sin campo type en API). */
export function inferNotificationVisual(title = '', body = '') {
    const text = `${title} ${body}`.toLowerCase();
    if (/suscri|plan|renov|aprobada|factur|pago|billing/i.test(text)) {
        return { icon: 'pi-credit-card', color: '#2563eb', bg: '#eff6ff' };
    }
    if (/orden|comanda|mesa|cocina|ticket|pos|venta/i.test(text)) {
        return { icon: 'pi-shopping-cart', color: '#059669', bg: '#ecfdf5' };
    }
    if (/invent|stock|producto|bajo/i.test(text)) {
        return { icon: 'pi-box', color: '#d97706', bg: '#fffbeb' };
    }
    if (/usuario|empleado|rol|acceso|sucursal/i.test(text)) {
        return { icon: 'pi-users', color: '#7c3aed', bg: '#f5f3ff' };
    }
    if (/reporte|informe|excel/i.test(text)) {
        return { icon: 'pi-chart-line', color: '#0891b2', bg: '#ecfeff' };
    }
    return { icon: 'pi-bell', color: '#64748b', bg: '#f1f5f9' };
}

export function formatNotificationDate(iso) {
    return formatNotificationRelativeDate(iso);
}

export function formatNotificationRelativeDate(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMs / 3_600_000);

    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) {
        if (diffMin < 1) return 'Ahora';
        if (diffMin < 60) return `${diffMin} min`;
        if (diffHr < 24) return `${diffHr} h`;
        return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
    }

    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays < 7) return `${diffDays} d`;

    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

/** Agrupa notificaciones al estilo feed (Nuevas / Hoy / Anteriores). */
export function groupNotificationsByTime(items = []) {
    const nuevas = [];
    const hoy = [];
    const anteriores = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const item of items) {
        if (item.isUnread) {
            nuevas.push(item);
            continue;
        }
        const created = new Date(item.createdAt);
        if (!Number.isNaN(created.getTime()) && created >= startOfToday) {
            hoy.push(item);
        } else {
            anteriores.push(item);
        }
    }

    return [
        { key: 'new', label: COMMUNICATION_MESSAGES.SECTION_NEW, items: nuevas },
        { key: 'today', label: COMMUNICATION_MESSAGES.SECTION_TODAY, items: hoy },
        { key: 'earlier', label: COMMUNICATION_MESSAGES.SECTION_EARLIER, items: anteriores },
    ].filter((section) => section.items.length > 0);
}
