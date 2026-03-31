/**
 * IAM Domain - User Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class User {
    constructor({
        id              = null,
        username        = '',
        email           = '',
        nombres         = '',
        apellidos       = '',
        tipoDocumento   = '',
        numeroDocumento = '',
        telefono        = '',
        roles           = [],
        isActive        = true,
        empresaId       = null,
        sucursalId      = null,
        sucursalNombre  = '',
    } = {}) {
        this.id              = id;
        this.username        = username;
        this.email           = email;
        this.nombres         = nombres;
        this.apellidos       = apellidos;
        this.tipoDocumento   = tipoDocumento;
        this.numeroDocumento = numeroDocumento;
        this.telefono        = telefono;
        this.roles           = roles;
        this.isActive        = isActive;
        this.empresaId       = empresaId;
        this.sucursalId      = sucursalId;
        this.sucursalNombre  = sucursalNombre;
    }

    /** @returns {string} Nombre completo del usuario */
    get fullName() {
        return `${this.nombres} ${this.apellidos}`.trim();
    }

    /** @returns {boolean} true si tiene el rol indicado */
    hasRole(role) {
        return this.roles.includes(role);
    }

    /** @returns {string} Rol principal del usuario */
    get primaryRole() {
        return this.roles[0] ?? '';
    }

    /** @returns {boolean} true si el usuario es OWNER */
    get isOwner() {
        return this.roles.includes('OWNER');
    }

    /** @returns {boolean} true si el usuario tiene sucursal asignada */
    get hasBranch() {
        return !!this.sucursalId;
    }
}
