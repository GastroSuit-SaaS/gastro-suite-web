import { UserProfile } from '../../domain/models/user-profile.entity.js';

/**
 * Users Infrastructure - UserProfile Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class UserProfileAssembler {

    /**
     * Transforma un recurso individual del API en una entidad UserProfile.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {UserProfile}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to UserProfile constructor parameters
        return new UserProfile({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {UserProfile[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => UserProfileAssembler.toEntityFromResource(r));
    }
}
