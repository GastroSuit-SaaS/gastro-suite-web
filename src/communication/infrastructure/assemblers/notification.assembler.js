export class Notification {
    constructor({
        id = null,
        userId = null,
        title = '',
        body = '',
        status = 'UNREAD',
        createdAt = null,
        readAt = null,
    } = {}) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.body = body;
        this.status = status;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }

    get isUnread() {
        return this.status === 'UNREAD';
    }
}

export const NotificationAssembler = {
    toEntityFromResource(r) {
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
    },

    toEntitiesFromResponse(response) {
        const list = response?.data ?? [];
        return list.map((item) => NotificationAssembler.toEntityFromResource(item));
    },
};
