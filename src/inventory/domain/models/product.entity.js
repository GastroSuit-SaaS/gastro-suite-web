/**
 * Inventory Domain - Product Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class Product {
    constructor({
        id          = null,
        name        = '',
        description = '',
        sku         = '',
        price       = 0,
        stock       = 0,
        categoryId  = null,
        category    = null,
    } = {}) {
        this.id          = id;
        this.name        = name;
        this.description = description;
        this.sku         = sku;
        this.price       = price;
        this.stock       = stock;
        this.categoryId  = categoryId;
        this.category    = category;
        // TODO: extend with additional domain fields (unit, minStock, etc.)
    }
}
