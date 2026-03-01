import { User } from '../../domain/models/user.entity.js';

/**
 * IAM Infrastructure - User Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 *
 * Convenciones de campo soportadas (snake_case y camelCase):
 *   id, username, email, roles, is_active/isActive
 *   nombres/first_name/firstName, apellidos/last_name/lastName
 *   tipo_documento/tipoDocumento, numero_documento/numeroDocumento, telefono/phone
 */
export class UserAssembler {

    /**
     * Transforma un recurso individual del API en una entidad User.
     * @param {Object} r - Recurso crudo del API.
     * @returns {User}
     */
    static toEntityFromResource(r) {
        return new User({
            id:              r.id              ?? null,
            username:        r.username        ?? '',
            email:           r.email           ?? '',
            nombres:         r.nombres         ?? r.firstName  ?? r.first_name  ?? '',
            apellidos:       r.apellidos       ?? r.lastName   ?? r.last_name   ?? '',
            tipoDocumento:   r.tipoDocumento   ?? r.documentType  ?? r.document_type  ?? '',
            numeroDocumento: r.numeroDocumento ?? r.documentNumber ?? r.document_number ?? '',
            telefono:        r.telefono        ?? r.phone      ?? '',
            roles:           r.roles           ?? [],
            isActive:        r.isActive        ?? r.is_active  ?? r.active ?? true,
        });
    }

    /**
     * Transforma un único recurso de respuesta en una entidad User.
     * Útil para login / perfil propio.
     * Soporta respuesta directa o anidada en { user, token }.
     * @param {Object} response - Respuesta Axios.
     * @returns {User|null}
     */
    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.user ?? response.data;
        if (!data) return null;
        return UserAssembler.toEntityFromResource(data);
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios.
     * @returns {User[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => UserAssembler.toEntityFromResource(r));
    }
}
