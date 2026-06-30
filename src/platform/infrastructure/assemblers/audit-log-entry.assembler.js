import { AuditLogEntry } from '../../domain/models/audit-log-entry.entity.js';
import { entitiesFromResponse } from '../../../shared/infrastructure/api-response.js';

export class AuditLogEntryAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new AuditLogEntry({
            auditLogId: r.auditLogId ?? r.id ?? null,
            createdAt: r.createdAt ?? null,
            actorDisplayName: r.actorDisplayName ?? '',
            actorUsername: r.actorUsername ?? '',
            action: r.action ?? '',
            entityLabel: r.entityLabel ?? '',
            details: r.details ?? '',
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, AuditLogEntryAssembler.toEntityFromResource);
    }
}
