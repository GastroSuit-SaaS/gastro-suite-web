/**
 * Menu Domain - MenuItem Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class MenuItem {
    constructor({
        id          = null,
        name        = '',
        description = '',
        price       = 0,
        cost        = 0,
        categoryId  = null,
        category    = '',
        imageUrl    = '',
        isAvailable = true,
        prepTime    = 0,
        station     = null,
        sku         = '',
        sortOrder   = 0,
    } = {}) {
        this.id          = id;
        this.name        = name;
        this.description = description;
        this.price       = price;
        this.cost        = cost;
        this.categoryId  = categoryId;
        this.category    = category;
        this.imageUrl    = imageUrl;
        this.isAvailable = isAvailable;
        this.prepTime    = prepTime;
        this.station     = station;
        this.sku         = sku;
        this.sortOrder   = sortOrder;
    }
}
