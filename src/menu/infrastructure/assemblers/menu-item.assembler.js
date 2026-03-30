import { MenuItem } from '../../domain/models/menu-item.entity.js';

/**
 * Menu Infrastructure - MenuItem Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class MenuItemAssembler {

    static toEntityFromResource(resource) {
        return new MenuItem({
            id:          resource.id,
            name:        resource.name        ?? '',
            description: resource.description ?? '',
            price:       resource.price       ?? 0,
            cost:        resource.cost         ?? 0,
            categoryId:  resource.categoryId  ?? resource.category_id  ?? null,
            category:    resource.category    ?? '',
            imageUrl:    resource.imageUrl    ?? resource.image_url    ?? '',
            isAvailable: resource.isAvailable ?? resource.is_available ?? true,
            prepTime:    resource.prepTime    ?? resource.prep_time    ?? 0,
            station:     resource.station     ?? null,
            stationId:   resource.stationId   ?? resource.station_id   ?? null,
            sku:         resource.sku          ?? '',
            sortOrder:   resource.sortOrder   ?? resource.sort_order   ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => MenuItemAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        return MenuItemAssembler.toEntityFromResource(response.data?.data ?? response.data);
    }

    static toResourceFromEntity(entity) {
        return {
            name:         entity.name,
            description:  entity.description,
            price:        entity.price,
            cost:         entity.cost,
            category_id:  entity.categoryId,
            image_url:    entity.imageUrl,
            is_available: entity.isAvailable,
            prep_time:    entity.prepTime,
            station_id:   entity.stationId,
            sku:          entity.sku,
            sort_order:   entity.sortOrder,
        };
    }
}
