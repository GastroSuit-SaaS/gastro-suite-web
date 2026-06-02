import { User } from '../../domain/models/user.entity.js';

export class UserAssembler {

    static toEntityFromResource(r) {
        return new User({
            id:              r.id ?? r.userId ?? r.user_id ?? null,
            username:        r.username ?? '',
            email:           r.email ?? '',
            nombres:         r.nombres ?? r.firstName ?? r.first_name ?? '',
            apellidos:       r.apellidos ?? r.lastName ?? r.last_name ?? '',
            tipoDocumento:   r.tipoDocumento ?? r.documentType ?? r.document_type ?? '',
            numeroDocumento: r.numeroDocumento ?? r.documentNumber ?? r.document_number ?? '',
            telefono:        r.telefono ?? r.phone ?? '',
            roles:           UserAssembler._normalizeRoles(r.roles),
            isActive:        r.isActive ?? r.is_active ?? r.active ?? true,
            empresaId:       r.empresaId ?? r.companyId ?? r.empresa_id ?? r.company_id ?? null,
            sucursalId:      r.sucursalId ?? r.branchId ?? r.sucursal_id ?? r.branch_id ?? null,
            sucursalNombre:  r.sucursalNombre ?? r.sucursal_nombre ?? r.branchName ?? '',
            employeeId:      r.employeeId ?? r.employee_id ?? null,
        });
    }

    /** AuthenticatedUserResource del backend. */
    static toEntityFromSignInResponse(data) {
        if (!data) return new User();
        return UserAssembler.toEntityFromResource(data);
    }

    static _normalizeRoles(roles) {
        if (!Array.isArray(roles)) return [];
        return roles.map((r) => (typeof r === 'string' ? r : r?.name ?? String(r)));
    }
}
