import { Branch } from '../../domain/models/branch.entity.js';

/**
 * Branches Infrastructure - Branch Assembler
 *
 * Transforma recursos crudos del API en entidades Branch.
 */
export class BranchAssembler {

    static toEntityFromResource(r) {
        return new Branch({
            id:              r.id              ?? null,
            empresaId:       r.empresaId       ?? r.empresa_id       ?? null,
            codigo:          r.codigo          ?? r.code             ?? '',
            nombre:          r.nombre          ?? r.name             ?? '',
            direccion:       r.direccion       ?? r.address          ?? '',
            departamento:    r.departamento    ?? r.department       ?? '',
            provincia:       r.provincia       ?? r.province         ?? '',
            distrito:        r.distrito        ?? r.district         ?? '',
            telefono:        r.telefono        ?? r.phone            ?? '',
            email:           r.email           ?? '',
            encargadoId:     r.encargadoId     ?? r.encargado_id     ?? null,
            encargadoNombre: r.encargadoNombre ?? r.encargado_nombre ?? r.managerName ?? '',
            isActive:        r.isActive        ?? r.is_active        ?? r.active ?? true,
            createdAt:       r.createdAt       ?? r.created_at       ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => BranchAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        if (!data) return null;
        return BranchAssembler.toEntityFromResource(data);
    }

    static toResourceFromEntity(entity) {
        return {
            codigo:          entity.codigo,
            nombre:          entity.nombre,
            direccion:       entity.direccion,
            departamento:    entity.departamento,
            provincia:       entity.provincia,
            distrito:        entity.distrito,
            telefono:        entity.telefono,
            email:           entity.email,
            encargadoId:     entity.encargadoId,
            encargadoNombre: entity.encargadoNombre,
            isActive:        entity.isActive,
        };
    }
}
