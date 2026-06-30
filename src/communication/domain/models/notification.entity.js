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
