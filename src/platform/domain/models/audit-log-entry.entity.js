export class AuditLogEntry {
    constructor({
        auditLogId = null,
        createdAt = null,
        actorDisplayName = '',
        actorUsername = '',
        action = '',
        entityLabel = '',
        details = '',
    } = {}) {
        this.auditLogId = auditLogId;
        this.createdAt = createdAt;
        this.actorDisplayName = actorDisplayName;
        this.actorUsername = actorUsername;
        this.action = action;
        this.entityLabel = entityLabel;
        this.details = details;
    }
}
