/**
 * Tables Domain - Zone Entity
 * Modelo de datos puro. Sin lógica, sin dependencias.
 */
export class Zone {
    constructor({
        id          = null,
        name        = '',
        description = '',
        color       = '#3B82F6',
        isActive    = true,
        tableCount  = 0,
        sucursalId  = null,
    } = {}) {
        this.id          = id;
        this.name        = name;
        this.description = description;
        this.color       = color;
        this.isActive    = isActive;
        this.tableCount  = tableCount;
        this.sucursalId  = sucursalId;
    }
}
