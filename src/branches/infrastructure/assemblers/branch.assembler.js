import { Branch } from '../../domain/models/branch.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class BranchAssembler {

    static toEntityFromResource(r) {
        return new Branch({
            id:              r.branchId ?? r.id ?? null,
            empresaId:       r.companyId ?? r.empresaId ?? r.empresa_id ?? null,
            codigo:          r.branchCode ?? r.codigo ?? r.code ?? '',
            nombre:          r.branchName ?? r.nombre ?? r.name ?? '',
            direccion:       r.branchAddress ?? r.direccion ?? r.address ?? '',
            departamento:    r.branchDepartment ?? r.departamento ?? r.department ?? '',
            provincia:       r.branchProvince ?? r.provincia ?? r.province ?? '',
            distrito:        r.branchDistrict ?? r.distrito ?? r.district ?? '',
            telefono:        r.branchPhone ?? r.telefono ?? r.phone ?? '',
            email:           r.branchEmail ?? r.email ?? '',
            encargadoId:     r.employeeId ?? r.encargadoId ?? r.encargado_id ?? null,
            encargadoNombre: r.employeeName ?? r.encargadoNombre ?? r.encargado_nombre ?? r.managerName ?? '',
            isActive:        r.branchIsActive ?? r.isActive ?? r.is_active ?? r.active ?? true,
            posBillableRequiresSent: r.posBillableRequiresSent ?? r.pos_billable_requires_sent ?? null,
            createdAt:       r.createdAt ?? r.branchCreatedAt ?? r.created_at ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, BranchAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, BranchAssembler.toEntityFromResource);
    }

    static toCreateRequest(entity, companyId) {
        return {
            companyId,
            branchCode: entity.codigo,
            branchName: entity.nombre,
            branchAddress: entity.direccion || null,
            branchDepartment: entity.departamento || null,
            branchProvince: entity.provincia || null,
            branchDistrict: entity.distrito || null,
            branchEmail: entity.email || null,
            branchPhone: entity.telefono || null,
            isActive: entity.isActive ?? true,
        };
    }

    static toUpdateRequest(entity) {
        return {
            branchCode: entity.codigo || null,
            branchName: entity.nombre || null,
            branchAddress: entity.direccion || null,
            branchDepartment: entity.departamento || null,
            branchProvince: entity.provincia || null,
            branchDistrict: entity.distrito || null,
            branchEmail: entity.email || null,
            branchPhone: entity.telefono || null,
            isActive: entity.isActive,
            posBillableRequiresSent: entity.posBillableRequiresSent,
        };
    }
}
