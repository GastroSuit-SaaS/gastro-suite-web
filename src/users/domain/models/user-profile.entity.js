/**
 * Users Domain - UserProfile Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 *
 * Representa un usuario operativo asignado a una sucursal.
 * El rol determina su nivel de acceso: BRANCH_ADMIN, WAITER, CASHIER, COOK.
 */
export class UserProfile {
    constructor({
        id              = null,
        username        = '',
        nombres         = '',
        apellidos       = '',
        email           = '',
        telefono        = '',
        tipoDocumento   = '',
        numeroDocumento = '',
        role            = '',
        sucursalId      = null,
        sucursalNombre  = '',
        isActive        = true,
        createdAt       = null,
    } = {}) {
        this.id              = id
        this.username        = username
        this.nombres         = nombres
        this.apellidos       = apellidos
        this.email           = email
        this.telefono        = telefono
        this.tipoDocumento   = tipoDocumento
        this.numeroDocumento = numeroDocumento
        this.role            = role
        this.sucursalId      = sucursalId
        this.sucursalNombre  = sucursalNombre
        this.isActive        = isActive
        this.createdAt       = createdAt
    }

    get fullName() { return `${this.nombres} ${this.apellidos}`.trim() }
    get initials() {
        const n = this.nombres.charAt(0).toUpperCase()
        const a = this.apellidos.charAt(0).toUpperCase()
        return `${n}${a}`
    }
}
