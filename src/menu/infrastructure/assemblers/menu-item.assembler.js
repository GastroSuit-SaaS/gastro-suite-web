import { MenuItem } from '../../domain/models/menu-item.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class MenuItemAssembler {

    static _descriptionForApi(description) {
        const text = description?.trim();
        if (!text || text.length < 5) return null;
        return text.length > 300 ? text.slice(0, 300) : text;
    }

    static _prepTimeForApi(prepTime) {
        const n = Number(prepTime);
        return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    }

    /** En PATCH desde el formulario: 0 = quitar tiempo; null en JSON no se usa aquí. */
    static _prepTimeForUpdate(prepTime) {
        const n = Number(prepTime);
        return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
    }

    static toEntityFromResource(resource) {
        const active = resource.isActive ?? resource.is_active ?? resource.isAvailable ?? resource.is_available;
        return new MenuItem({
            id:          resource.itemId ?? resource.id ?? null,
            name:        resource.itemName ?? resource.name ?? '',
            description: resource.itemDescription ?? resource.description ?? '',
            price:       Number(resource.itemPrice ?? resource.price ?? 0),
            cost:        Number(resource.itemCost ?? resource.cost ?? 0),
            categoryId:  resource.categoryId ?? resource.category_id ?? null,
            category:    resource.categoryName ?? resource.category ?? '',
            imageUrl:    resource.itemImageUrl ?? resource.imageUrl ?? resource.image_url ?? '',
            isAvailable: active !== false && active !== 'false',
            prepTime:    MenuItemAssembler._prepTimeForApi(
                resource.itemPrepTime ?? resource.prepTime ?? resource.prep_time,
            ),
            station:     resource.stationName ?? resource.station ?? null,
            stationId:   resource.stationId ?? resource.station_id ?? null,
            sku:         resource.skuCode ?? resource.sku ?? '',
            sortOrder:   resource.sortOrder ?? resource.sort_order ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, MenuItemAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, MenuItemAssembler.toEntityFromResource);
    }

    static toCreateResource(entity) {
        const name = entity.name?.trim();
        const sku = entity.sku?.trim();
        return {
            categoryId: entity.categoryId,
            stationId: entity.stationId || null,
            itemName: name,
            itemDescription: MenuItemAssembler._descriptionForApi(entity.description),
            itemPrice: entity.price,
            itemPrepTime: MenuItemAssembler._prepTimeForApi(entity.prepTime),
            skuCode: sku || `SKU-${Date.now()}`,
            isActive: entity.isAvailable !== false,
        };
    }

    static toUpdateResource(entity) {
        const name = entity.name?.trim();
        const sku = entity.sku?.trim();
        return {
            categoryId: entity.categoryId ?? null,
            stationId: entity.stationId ?? null,
            itemName: name || null,
            itemDescription: MenuItemAssembler._descriptionForApi(entity.description),
            itemPrice: entity.price ?? null,
            itemPrepTime: MenuItemAssembler._prepTimeForUpdate(entity.prepTime),
            skuCode: sku || null,
            isActive: entity.isAvailable !== undefined ? entity.isAvailable : null,
        };
    }
}
