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
            id:             resource.id,
            name:           resource.name           ?? '',
            description:    resource.description    ?? '',
            sku:            resource.sku            ?? '',
            price:          resource.price          ?? 0,
            cost:           resource.cost           ?? 0,
            stock:          resource.stock          ?? 0,
            minStock:       resource.minStock       ?? resource.min_stock        ?? 0,
            maxStock:       resource.maxStock       ?? resource.max_stock        ?? null,
            unit:           resource.unit           ?? 'unidad',
            categoryId:     resource.categoryId     ?? resource.category_id      ?? null,
            category:       resource.category       ?? null,
            supplierId:     resource.supplierId     ?? resource.supplier_id      ?? null,
            supplier:       resource.supplier       ?? null,
            imageUrl:       resource.imageUrl       ?? resource.image_url        ?? '',
            isActive:       resource.isActive       ?? resource.is_active        ?? true,
            sucursalId:     resource.sucursalId     ?? resource.sucursal_id      ?? null,
            expirationDate: resource.expirationDate ?? resource.expiration_date  ?? null,
            createdAt:      resource.createdAt      ?? resource.created_at       ?? null,
            updatedAt:      resource.updatedAt      ?? resource.updated_at       ?? null,
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
        if (!data) return null;
        return ProductAssembler.toEntityFromResource(data);
    }

    static toResourceFromEntity(product) {
        return {
            name:            product.name,
            description:     product.description,
            sku:             product.sku,
            price:           product.price,
            cost:            product.cost,
            stock:           product.stock,
            min_stock:       product.minStock,
            max_stock:       product.maxStock,
            unit:            product.unit,
            category_id:     product.categoryId,
            supplier_id:     product.supplierId,
            image_url:       product.imageUrl,
            is_active:       product.isActive,
            sucursal_id:     product.sucursalId,
            expiration_date: product.expirationDate,
        };
    }
}
