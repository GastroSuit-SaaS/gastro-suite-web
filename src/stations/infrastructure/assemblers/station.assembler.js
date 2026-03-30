import { Station } from '../../domain/models/station.entity.js';

/**
 * Kitchen Infrastructure - Station Assembler
 *
 * Transforma recursos crudos del API en entidades Station y viceversa.
 */
export class StationAssembler {

    static toEntityFromResource(resource) {
        return new Station({
            id:          resource.id,
            name:        resource.name        ?? '',
            description: resource.description ?? '',
            color:       resource.color       ?? '#3b82f6',
            icon:        resource.icon        ?? 'pi-bolt',
            isActive:    resource.isActive    ?? true,
        });
    }

    static toEntitiesFromResponse(data) {
        if (!Array.isArray(data)) return [];
        return data.map(r => StationAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        return StationAssembler.toEntityFromResource(response.data);
    }
}
