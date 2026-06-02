import { Category } from '../../domain/models/category.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

export class CategoryAssembler {

    static resolveCategoryId(resource) {
        const raw = resource?.categoryId ?? resource?.category_id ?? resource?.id ?? null;
        if (raw == null || raw === '' || String(raw) === 'null') return null;
        return String(raw);
    }

    /** API exige 5–300 caracteres si se envía descripción; vacío → null. */
    static _descriptionForApi(description) {
        const text = description?.trim();
        if (!text || text.length < 5) return null;
        return text.length > 300 ? text.slice(0, 300) : text;
    }

    static _colorForApi(color) {
        if (!color) return null;
        const raw = String(color).trim();
        const hex = raw.startsWith('#') ? raw : `#${raw}`;
        return hex.length >= 7 && hex.length <= 10 ? hex : null;
    }

    /** API exige orden > 0; si no hay, va al final de la lista de la sucursal. */
    static _sortOrderForCreate(sortOrder, existingCategories = []) {
        const n = Number(sortOrder);
        if (Number.isFinite(n) && n > 0) return n;
        const max = existingCategories.reduce(
            (m, c) => Math.max(m, Number(c.sortOrder) || 0),
            0,
        );
        return max + 1;
    }

    static toEntityFromResource(resource) {
        return new Category({
            id:          CategoryAssembler.resolveCategoryId(resource),
            name:        resource.categoryName ?? resource.name ?? '',
            description: resource.categoryDescription ?? resource.description ?? '',
            color:       resource.categoryColor ?? resource.color ?? '#3B82F6',
            isActive:    resource.isActive ?? resource.is_active ?? true,
            sortOrder:   resource.categorySortOrder ?? resource.sortOrder ?? resource.sort_order ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, CategoryAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, CategoryAssembler.toEntityFromResource);
    }

    static toResourceFromEntity(entity, branchId, existingCategories = []) {
        const name = entity.name?.trim();
        return {
            branchId,
            categoryName: name,
            categoryDescription: CategoryAssembler._descriptionForApi(entity.description),
            categoryColor: CategoryAssembler._colorForApi(entity.color),
            isActive: entity.isActive ?? true,
            categorySortOrder: CategoryAssembler._sortOrderForCreate(entity.sortOrder, existingCategories),
        };
    }

    static _sortOrderForUpdate(sortOrder) {
        const n = Number(sortOrder);
        return Number.isFinite(n) && n > 0 ? n : null;
    }

    static toUpdateResource(entity) {
        const name = entity.name?.trim();
        return {
            categoryName: name || null,
            categoryDescription: CategoryAssembler._descriptionForApi(entity.description),
            categoryColor: CategoryAssembler._colorForApi(entity.color),
            isActive: entity.isActive,
            categorySortOrder: CategoryAssembler._sortOrderForUpdate(entity.sortOrder),
        };
    }
}
