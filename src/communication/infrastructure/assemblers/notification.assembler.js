import { Notification } from '../../domain/models/notification.entity.js';

export class NotificationAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new Notification({
            id: r.id,
            userId: r.userId,
            title: r.title ?? '',
            body: r.body ?? '',
            status: r.status ?? 'UNREAD',
            createdAt: r.createdAt,
            readAt: r.readAt,
        });
    }

    static toEntitiesFromResponse(response) {
        const list = response?.data ?? [];
        return list.map((item) => NotificationAssembler.toEntityFromResource(item));
    }

    static toPageFromResponse(response) {
        const data = response?.data ?? {};
        const content = (data.content ?? []).map((item) => NotificationAssembler.toEntityFromResource(item));
        return {
            content,
            totalElements: data.totalElements ?? content.length,
            currentPage: data.currentPage ?? 0,
            pageSize: data.pageSize ?? content.length,
            totalPages: data.totalPages ?? 1,
            hasNext: data.hasNext ?? false,
        };
    }
}
