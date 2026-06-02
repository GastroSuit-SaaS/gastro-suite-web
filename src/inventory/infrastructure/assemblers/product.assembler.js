import { Product } from '../../domain/models/product.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

const UNIT_WEB_TO_API = {
    unidad:  'UNIDAD',
    kg:      'KG',
    litro:   'LITRO',
    botella: 'BOTELLA',
    paquete: 'PAQUETE',
    frasco:  'FRASCO',
    caja:    'CAJA',
    bolsa:   'BOLSA',
};

const UNIT_API_TO_WEB = Object.fromEntries(
    Object.entries(UNIT_WEB_TO_API).map(([k, v]) => [v, k]),
);

export class ProductAssembler {

    static _unitToApi(unit) {
        if (!unit) return 'UNIDAD';
        const key = String(unit).toLowerCase();
        const upper = String(unit).toUpperCase();
        return UNIT_WEB_TO_API[key] ?? UNIT_API_TO_WEB[upper] ?? upper;
    }

    static _unitToWeb(unit) {
        if (!unit) return 'unidad';
        const upper = String(unit).toUpperCase();
        return UNIT_API_TO_WEB[upper] ?? String(unit).toLowerCase();
    }

    static _descriptionForApi(description) {
        const text = description?.trim();
        if (!text || text.length < 2) return null;
        return text.length > 500 ? text.slice(0, 500) : text;
    }

    /**
     * @param {import('../../domain/models/product.entity.js').Product|Object} product
     * @param {Array<{ id: string, name: string }>} [categories]
     */
    static resolveCategoryId(product, categories = []) {
        const direct = product?.categoryId ?? product?.category_id;
        if (direct != null && direct !== '') return direct;

        const name = product?.category?.trim?.() ?? product?.category;
        if (!name) return null;

        const match = categories.find(
            c => String(c.id) === String(name) || c.name === name,
        );
        return match?.id ?? null;
    }

    static toEntityFromResource(resource) {
        return new Product({
            id:             resource.productId ?? resource.id ?? null,
            name:           resource.productName ?? resource.name ?? '',
            description:    resource.productDescription ?? resource.description ?? '',
            sku:            resource.productSku ?? resource.sku ?? '',
            price:          Number(resource.productPrice ?? resource.price ?? 0),
            cost:           Number(resource.productCost ?? resource.cost ?? 0),
            stock:          Number(resource.productStock ?? resource.stock ?? 0),
            minStock:       Number(resource.productMinStock ?? resource.minStock ?? resource.min_stock ?? 0),
            maxStock:       resource.productMaxStock ?? resource.maxStock ?? resource.max_stock ?? null,
            unit:           ProductAssembler._unitToWeb(resource.productUnit ?? resource.unit),
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

    /**
     * @param {Object} product
     * @param {{ categories?: Array }} [ctx]
     */
    static toCreateResource(product, ctx = {}) {
        const categories = ctx.categories ?? [];
        const categoryId = ProductAssembler.resolveCategoryId(product, categories);

        return {
            categoryId,
            productName:        product.name?.trim(),
            productDescription: ProductAssembler._descriptionForApi(product.description),
            productSku:         product.sku?.trim(),
            productPrice:       Number(product.price ?? 0),
            productCost:        Number(product.cost ?? 0),
            productStock:       Number(product.stock ?? 0),
            productMinStock:    Number(product.minStock ?? 0),
            productMaxStock:    product.maxStock != null ? Number(product.maxStock) : null,
            productUnit:        ProductAssembler._unitToApi(product.unit),
            isActive:           product.isActive ?? true,
        };
    }

    /**
     * @param {Object} product
     * @param {{ categories?: Array, includeStock?: boolean }} [ctx]
     */
    static toUpdateResource(product, ctx = {}) {
        const categories = ctx.categories ?? [];
        const categoryId = ProductAssembler.resolveCategoryId(product, categories);
        const resource = {
            categoryId:         categoryId ?? undefined,
            productName:        product.name?.trim() || undefined,
            productDescription: ProductAssembler._descriptionForApi(product.description),
            productSku:         product.sku?.trim() || undefined,
            productPrice:       product.price != null ? Number(product.price) : undefined,
            productCost:        product.cost != null ? Number(product.cost) : undefined,
            productMinStock:    product.minStock != null ? Number(product.minStock) : undefined,
            productMaxStock:    product.maxStock != null ? Number(product.maxStock) : undefined,
            productUnit:        product.unit ? ProductAssembler._unitToApi(product.unit) : undefined,
            isActive:           product.isActive,
        };

        if (ctx.includeStock && product.stock != null) {
            resource.productStock = Number(product.stock);
        }

        return Object.fromEntries(
            Object.entries(resource).filter(([, v]) => v !== undefined),
        );
    }
}
