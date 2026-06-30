import { BaseApi } from '../../../shared/infrastructure/base-api.js';

export class NotificationsApi extends BaseApi {
    list(params) {
        return this.http.get('/me/notifications', { params });
    }

    unreadCount() {
        return this.http.get('/me/notifications/unread-count');
    }

    markAsRead(notificationId) {
        return this.http.patch(`/me/notifications/${notificationId}/read`);
    }

    markAsUnread(notificationId) {
        return this.http.patch(`/me/notifications/${notificationId}/unread`);
    }

    deleteNotification(notificationId) {
        return this.http.delete(`/me/notifications/${notificationId}`);
    }

    deleteNotifications(ids) {
        return this.http.delete('/me/notifications/bulk', { data: { ids } });
    }

    deleteAllNotifications() {
        return this.http.delete('/me/notifications/all');
    }

    markAllAsRead() {
        return this.http.patch('/me/notifications/read-all');
    }
}

export const notificationsApi = new NotificationsApi();
