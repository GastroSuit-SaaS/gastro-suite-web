import { Product } from '../../domain/models/product.entity.js';

/**
 * Inventory Infrastructure - Product Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class ProductAssembler {

    static toEntityFromResource(resource) {
        return new Product({
            id:          resource.id,
            name:        resource.name        ?? '',
            description: resource.description ?? '',
            sku:         resource.sku         ?? '',
            price:       resource.price       ?? 0,
            stock:       resource.stock       ?? 0,
            categoryId:  resource.categoryId  ?? resource.category_id ?? null,
            category:    resource.category    ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const data = response.data?.items ?? response.data?.data ?? response.data;
        return Array.isArray(data) ? data.map(r => ProductAssembler.toEntityFromResource(r)) : [];
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        return ProductAssembler.toEntityFromResource(data);
    }

    static toResourceFromEntity(product) {
        return {
            name:        product.name,
            description: product.description,
            sku:         product.sku,
            price:       product.price,
            stock:       product.stock,
            category_id: product.categoryId,
        };
    }
}
