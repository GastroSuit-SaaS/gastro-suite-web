/**
 * Inventory Domain - InventoryCategory Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class InventoryCategory {
    constructor({
        id          = null,
        name        = '',
        description = '',
        color       = '#3B82F6',
        isActive    = true,
        sortOrder   = 0,
        count       = 0,
        sucursalId  = null,
    } = {}) {
        this.id          = id;
        this.name        = name;
        this.description = description;
        this.color       = color;
        this.isActive    = isActive;
        this.sortOrder   = sortOrder;
        this.count       = count;
        this.sucursalId  = sucursalId;
    }
}
