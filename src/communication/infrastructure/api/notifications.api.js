import { BaseApi } from '../../../shared/infrustructure/base-api.js';

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

    markAllAsRead() {
        return this.http.patch('/me/notifications/read-all');
    }
}

export const notificationsApi = new NotificationsApi();
