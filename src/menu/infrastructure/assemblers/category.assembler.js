import { Category } from '../../domain/models/category.entity.js';

/**
 * Menu Infrastructure - Category Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class CategoryAssembler {

    static toEntityFromResource(resource) {
        return new Category({
            id:          resource.id,
            name:        resource.name        ?? '',
            description: resource.description ?? '',
            color:       resource.color       ?? '#3B82F6',
            isActive:    resource.isActive    ?? resource.is_active ?? true,
            sortOrder:   resource.sortOrder   ?? resource.sort_order ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        return response.data.map(r => CategoryAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        return CategoryAssembler.toEntityFromResource(response.data?.data ?? response.data);
    }

    static toResourceFromEntity(entity) {
        return {
            name:        entity.name,
            description: entity.description,
            color:       entity.color,
            is_active:   entity.isActive,
            sort_order:  entity.sortOrder,
        };
    }
}
