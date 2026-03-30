/**
 * Stations Domain - Station Entity
 *
 * Representa una estación de preparación del restaurante (e.g. Cocina Caliente, Bar, Pastelería).
 * Objeto de dominio puro — sin dependencias Vue, sin HTTP.
 */
export class Station {
    constructor({
        id          = null,
        name        = '',
        description = '',
        color       = '#3b82f6',
        isActive    = true,
    } = {}) {
        this.id          = id;
        this.name        = name;
        this.description = description;
        this.color       = color;
        this.isActive    = isActive;
    }
}
