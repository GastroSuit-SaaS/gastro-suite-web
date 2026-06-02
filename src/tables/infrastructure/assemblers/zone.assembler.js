import { Zone } from '../../domain/models/zone.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

export class ZoneAssembler {

    static toEntityFromResource(r) {
        return new Zone({
            id:          r.zoneId ?? r.id ?? null,
            name:        r.zoneName ?? r.name ?? '',
            description: r.zoneDescription ?? r.description ?? '',
            color:       r.zoneColor ?? r.color ?? '#3B82F6',
            isActive:    r.zoneIsActive ?? r.isActive ?? r.is_active ?? true,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, ZoneAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, ZoneAssembler.toEntityFromResource);
    }

    static toResourceFromEntity(zone, branchId) {
        return {
            branchId,
            zoneName: zone.name,
            zoneDescription: zone.description || null,
            zoneColor: zone.color || null,
            isActive: zone.isActive ?? true,
        };
    }
}
