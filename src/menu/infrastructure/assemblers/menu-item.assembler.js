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
            sku:         resource.sku          ?? '',
            sortOrder:   resource.sortOrder   ?? resource.sort_order   ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        return response.data.map(r => MenuItemAssembler.toEntityFromResource(r));
    }
}
