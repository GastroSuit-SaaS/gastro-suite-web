/**
 * Inventory Domain - Product Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */

export const STOCK_STATUS = Object.freeze({
    IN_STOCK:     'in_stock',
    LOW_STOCK:    'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
});

export class Product {
    constructor({
        id             = null,
        name           = '',
        description    = '',
        sku            = '',
        price          = 0,
        cost           = 0,
        stock          = 0,
        minStock       = 0,
        maxStock       = null,
        unit           = 'unidad',
        categoryId     = null,
        category       = null,
        supplierId     = null,
        supplier       = null,
        imageUrl       = '',
        isActive       = true,
        sucursalId     = null,
        expirationDate = null,
        createdAt      = null,
        updatedAt      = null,
    } = {}) {
        this.id             = id;
        this.name           = name;
        this.description    = description;
        this.sku            = sku;
        this.price          = price;
        this.cost           = cost;
        this.stock          = stock;
        this.minStock       = minStock;
        this.maxStock       = maxStock;
        this.unit           = unit;
        this.categoryId     = categoryId;
        this.category       = category;
        this.supplierId     = supplierId;
        this.supplier       = supplier;
        this.imageUrl       = imageUrl;
        this.isActive       = isActive;
        this.sucursalId     = sucursalId;
        this.expirationDate = expirationDate;
        this.createdAt      = createdAt;
        this.updatedAt      = updatedAt;
    }

    get stockStatus() {
        if (this.stock <= 0)         return STOCK_STATUS.OUT_OF_STOCK;
        if (this.stock <= this.minStock) return STOCK_STATUS.LOW_STOCK;
        return STOCK_STATUS.IN_STOCK;
    }

    get isLowStock() {
        return this.stockStatus === STOCK_STATUS.LOW_STOCK;
    }

    get isOutOfStock() {
        return this.stockStatus === STOCK_STATUS.OUT_OF_STOCK;
    }

    get margin() {
        if (!this.price || !this.cost) return 0;
        return this.price - this.cost;
    }

    get marginPercentage() {
        if (!this.price) return 0;
        return ((this.margin / this.price) * 100);
    }
}
