import { PlatformAdmin } from '../../domain/models/platform-admin.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class PlatformAdminAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new PlatformAdmin({
            userId: r.userId ?? r.id ?? null,
            username: r.username ?? '',
            email: r.email ?? '',
            nombres: r.nombres ?? r.firstName ?? '',
            apellidos: r.apellidos ?? r.lastName ?? '',
            tipoDocumento: r.tipoDocumento ?? r.documentType ?? '',
            numeroDocumento: r.numeroDocumento ?? r.documentNumber ?? '',
            telefono: r.telefono ?? r.phone ?? '',
            active: r.active ?? r.isActive ?? true,
            createdAt: r.createdAt ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, PlatformAdminAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, PlatformAdminAssembler.toEntityFromResource);
    }
}
