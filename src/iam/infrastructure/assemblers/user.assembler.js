import { User } from '../../domain/models/user.entity.js';

/**
 * IAM Infrastructure - User Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class UserAssembler {

    /**
     * Transforma un recurso individual del API en una entidad User.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {User}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to User constructor parameters
        return new User({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {User[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => UserAssembler.toEntityFromResource(r));
    }

    /**
     * Transforma un único recurso de respuesta en una entidad User.
     * Útil para login / perfil propio.
     * @param {Object} response - Respuesta Axios.
     * @returns {User|null}
     */
    static toEntityFromResponse(response) {
        if (response.status !== 200) return null;
        // TODO: adjust extraction path (e.g. response.data.user)
        return UserAssembler.toEntityFromResource(response.data);
    }
}
