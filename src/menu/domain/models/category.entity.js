/**
 * Menu Domain - Category Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class Category {
    constructor({
        id          = null,
        name        = '',
        description = '',
        color       = '#3B82F6',
        isActive    = true,
        sortOrder   = 0,
    } = {}) {
        this.id          = id;
        this.name        = name;
        this.description = description;
        this.color       = color;
        this.isActive    = isActive;
        this.sortOrder   = sortOrder;
    }
}
