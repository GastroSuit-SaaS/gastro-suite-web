import { InventoryCategory } from '../../domain/models/inventory-category.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

export class InventoryCategoryAssembler {

    static resolveCategoryId(resource) {
        const raw = resource?.categoryId ?? resource?.category_id ?? resource?.id ?? null;
        if (raw == null || raw === '' || String(raw) === 'null') return null;
        return raw;
    }

    static _descriptionForApi(description) {
        const text = description?.trim();
        if (!text || text.length < 2) return null;
        return text.length > 500 ? text.slice(0, 500) : text;
    }

    static _colorForApi(color) {
        if (!color) return null;
        const raw = String(color).trim();
        const hex = raw.startsWith('#') ? raw : `#${raw}`;
        return hex.length >= 4 && hex.length <= 7 ? hex : null;
    }

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
        return new InventoryCategory({
            id:          InventoryCategoryAssembler.resolveCategoryId(resource),
            name:        resource.categoryName ?? resource.name ?? '',
            description: resource.categoryDescription ?? resource.description ?? '',
            color:       resource.categoryColor ?? resource.color ?? '#3B82F6',
            isActive:    resource.isActive ?? resource.is_active ?? true,
            sortOrder:   resource.categorySortOrder ?? resource.sortOrder ?? resource.sort_order ?? 0,
            sucursalId:  resource.branchId ?? resource.branch_id ?? resource.sucursalId ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, InventoryCategoryAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, InventoryCategoryAssembler.toEntityFromResource);
    }

    static toCreateResource(entity, branchId, existingCategories = []) {
        const name = entity.name?.trim();
        return {
            branchId,
            categoryName: name,
            categoryDescription: InventoryCategoryAssembler._descriptionForApi(entity.description),
            categoryColor: InventoryCategoryAssembler._colorForApi(entity.color),
            isActive: entity.isActive ?? true,
            categorySortOrder: InventoryCategoryAssembler._sortOrderForCreate(entity.sortOrder, existingCategories),
        };
    }

    static toUpdateResource(entity) {
        const name = entity.name?.trim();
        const sort = Number(entity.sortOrder);
        return {
            categoryName: name || null,
            categoryDescription: InventoryCategoryAssembler._descriptionForApi(entity.description),
            categoryColor: InventoryCategoryAssembler._colorForApi(entity.color),
            isActive: entity.isActive,
            categorySortOrder: Number.isFinite(sort) && sort > 0 ? sort : null,
        };
    }
}
