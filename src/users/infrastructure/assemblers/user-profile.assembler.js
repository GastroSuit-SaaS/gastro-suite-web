import { UserProfile } from '../../domain/models/user-profile.entity.js';

/**
 * Users Infrastructure - UserProfile Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class UserProfileAssembler {

    static toEntityFromResource(resource) {
        return new UserProfile({
            id:              resource.id              ?? null,
            username:        resource.username        ?? '',
            nombres:         resource.nombres         ?? resource.first_name  ?? resource.firstName  ?? '',
            apellidos:       resource.apellidos       ?? resource.last_name   ?? resource.lastName   ?? '',
            email:           resource.email           ?? '',
            telefono:        resource.telefono        ?? resource.phone       ?? '',
            tipoDocumento:   resource.tipoDocumento   ?? resource.tipo_documento   ?? resource.document_type  ?? '',
            numeroDocumento: resource.numeroDocumento ?? resource.numero_documento ?? resource.document_number ?? '',
            role:            resource.role            ?? resource.roles?.[0]  ?? '',
            sucursalId:      resource.sucursalId      ?? resource.sucursal_id ?? null,
            sucursalNombre:  resource.sucursalNombre  ?? resource.sucursal_nombre ?? '',
            isActive:        resource.isActive        ?? resource.is_active   ?? true,
            createdAt:       resource.createdAt       ?? resource.created_at  ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const data = response.data?.items ?? response.data?.data ?? response.data;
        return Array.isArray(data) ? data.map(r => UserProfileAssembler.toEntityFromResource(r)) : [];
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        return UserProfileAssembler.toEntityFromResource(data);
    }

    static toResourceFromEntity(user) {
        return {
            username:         user.username,
            nombres:          user.nombres,
            apellidos:        user.apellidos,
            email:            user.email,
            telefono:         user.telefono,
            tipo_documento:   user.tipoDocumento,
            numero_documento: user.numeroDocumento,
            role:             user.role,
            sucursal_id:      user.sucursalId,
            is_active:        user.isActive,
        };
    }
}
