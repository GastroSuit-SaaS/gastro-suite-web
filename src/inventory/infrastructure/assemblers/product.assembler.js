import { Product } from '../../domain/models/product.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

export class ProductAssembler {

    static toEntityFromResource(resource) {
        return new Product({
            id:             resource.productId ?? resource.id ?? null,
            name:           resource.productName ?? resource.name ?? '',
            description:    resource.productDescription ?? resource.description ?? '',
            sku:            resource.productSku ?? resource.sku ?? '',
            price:          Number(resource.productPrice ?? resource.price ?? 0),
            cost:           Number(resource.productCost ?? resource.cost ?? 0),
            stock:          resource.productStock ?? resource.stock ?? 0,
            minStock:       resource.productMinStock ?? resource.minStock ?? resource.min_stock ?? 0,
            maxStock:       resource.productMaxStock ?? resource.maxStock ?? resource.max_stock ?? null,
            unit:           resource.productUnit ?? resource.unit ?? 'unidad',
            categoryId:     resource.categoryId ?? resource.category_id ?? null,
            category:       resource.categoryName ?? resource.category ?? null,
            supplierId:     resource.supplierId ?? resource.supplier_id ?? null,
            supplier:       resource.supplier ?? null,
            imageUrl:       resource.imageUrl ?? resource.image_url ?? '',
            isActive:       resource.isActive ?? resource.is_active ?? true,
            sucursalId:     resource.branchId ?? resource.sucursalId ?? resource.sucursal_id ?? null,
            expirationDate: resource.expirationDate ?? resource.expiration_date ?? null,
            createdAt:      resource.createdAt ?? resource.created_at ?? null,
            updatedAt:      resource.updatedAt ?? resource.updated_at ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, ProductAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, ProductAssembler.toEntityFromResource);
    }

    static toResourceFromEntity(product) {
        return {
            categoryId: product.categoryId,
            productName: product.name,
            productDescription: product.description || null,
            productSku: product.sku,
            productPrice: product.price,
            productCost: product.cost,
            productStock: product.stock,
            productMinStock: product.minStock,
            productMaxStock: product.maxStock,
            productUnit: product.unit,
            isActive: product.isActive ?? true,
        };
    }
}
