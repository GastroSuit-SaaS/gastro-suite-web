import { Station } from '../../domain/models/station.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

export class StationAssembler {

    static toEntityFromResource(resource) {
        return new Station({
            id:          resource.stationId ?? resource.id ?? null,
            name:        resource.stationName ?? resource.name ?? '',
            description: resource.stationDescription ?? resource.description ?? '',
            color:       resource.stationColor ?? resource.color ?? '#3b82f6',
            isActive:    resource.isActive ?? resource.is_active ?? true,
        });
    }

    static toEntitiesFromResponse(response) {
        if (!response) return [];
        return entitiesFromResponse(response, StationAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, StationAssembler.toEntityFromResource);
    }

    static toResourceFromEntity(entity, branchId) {
        return {
            branchId,
            stationName: entity.name,
            stationDescription: entity.description || null,
            stationColor: entity.color || null,
            isActive: entity.isActive ?? true,
        };
    }
}
