/**
 * POS Domain - MenuItem Entity
 *
 * Representa un producto de la carta disponible para agregar a una orden.
 * Objeto de dominio puro — sin dependencias Vue, sin HTTP.
 *
 * Nota: Distinto a Inventory.Product.
 * Un MenuItem es la vista POS de un producto: precio de venta, categoría de menú,
 * disponibilidad en carta. No gestiona stock.
 */
export class MenuItem {
    constructor({
        id          = null,
        name        = '',
        description = '',
        price       = 0,
        categoryId  = 'otros',
        category    = '',
        imageUrl    = null,
        available   = true,
    } = {}) {
        this.id          = id;
        this.name        = name;
        this.description = description;
        this.price       = price;
        this.categoryId  = categoryId;
        this.category    = category;
        this.imageUrl    = imageUrl;
        this.available   = available;
    }
}
