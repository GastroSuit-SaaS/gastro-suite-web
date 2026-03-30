import { Zone } from '../../domain/models/zone.entity.js';

/**
 * Tables Infrastructure - Zone Assembler
 *
 * Transforma recursos crudos del API en entidades Zone y viceversa.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class ZoneAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Zone.
     * Soporta snake_case y camelCase.
     * @param {Object} r - Recurso crudo del API.
     * @returns {Zone}
     */
    static toEntityFromResource(r) {
        return new Zone({
            id:          r.id          ?? null,
            name:        r.name        ?? '',
            description: r.description ?? '',
            color:       r.color       ?? '#3B82F6',
            isActive:    r.isActive    ?? r.is_active ?? true,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la coleccion de recursos en entidades.
     * @param {Object} response - Respuesta Axios.
     * @returns {Zone[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => ZoneAssembler.toEntityFromResource(r));
    }

    /**
     * Serializa una Zone a DTO para el backend.
     * @param {Zone} zone
     * @returns {Object}
     */
    static toResourceFromEntity(zone) {
        return {
            name:        zone.name,
            description: zone.description,
            color:       zone.color,
            isActive:    zone.isActive,
        };
    }
}
