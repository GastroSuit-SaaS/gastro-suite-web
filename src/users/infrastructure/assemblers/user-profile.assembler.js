import { UserProfile } from '../../domain/models/user-profile.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

export class UserProfileAssembler {

    static toEntityFromResource(resource) {
        const roles = resource.roles;
        const role = Array.isArray(roles) && roles.length
            ? (typeof roles[0] === 'string' ? roles[0] : roles[0]?.name ?? String(roles[0]))
            : (resource.role ?? '');
        return new UserProfile({
            id:              resource.employeeId ?? resource.id ?? null,
            username:        resource.username ?? resource.userName ?? '',
            nombres:         resource.employeeName ?? resource.nombres ?? resource.firstName ?? '',
            apellidos:       resource.employeeSurname ?? resource.apellidos ?? resource.lastName ?? '',
            email:           resource.employeeEmail ?? resource.email ?? '',
            telefono:        resource.employeePhoneNumber ?? resource.telefono ?? resource.phone ?? '',
            tipoDocumento:   resource.employeeDocumentType ?? resource.tipoDocumento ?? resource.tipo_documento ?? '',
            numeroDocumento: resource.employeeDocumentNumber ?? resource.numeroDocumento ?? resource.numero_documento ?? '',
            role,
            sucursalId:      resource.branchId ?? resource.sucursalId ?? resource.sucursal_id ?? null,
            sucursalNombre:  resource.sucursalNombre ?? resource.sucursal_nombre ?? resource.branchName ?? '',
            isActive:        resource.isActive ?? resource.is_active ?? true,
            createdAt:       resource.createdAt ?? resource.created_at ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, UserProfileAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, UserProfileAssembler.toEntityFromResource);
    }

    static toCreateRequest(user, companyId) {
        return {
            userName: user.username,
            password: user.password,
            roles: [user.role],
            companyId,
            branchId: user.sucursalId || null,
            employeeName: user.nombres,
            employeeSurname: user.apellidos,
            employeeEmail: user.email,
            employeeDocumentType: user.tipoDocumento,
            employeeDocumentNumber: user.numeroDocumento,
            employeePhoneNumber: user.telefono,
        };
    }

    static toUpdateRequest(user) {
        const body = {
            userName: user.username || null,
            employeeName: user.nombres || null,
            employeeSurname: user.apellidos || null,
            employeeEmail: user.email || null,
            employeeDocumentType: user.tipoDocumento || null,
            employeeDocumentNumber: user.numeroDocumento || null,
            employeePhoneNumber: user.telefono || null,
            branchId: user.sucursalId ?? null,
            isActive: user.isActive,
        };
        if (user.password) body.password = user.password;
        if (user.role) body.roles = [user.role];
        return body;
    }
}
