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
    }

    /** @returns {string} Nombre completo del usuario */
    get fullName() {
        return `${this.nombres} ${this.apellidos}`.trim();
    }

    /** @returns {boolean} true si tiene el rol indicado */
    hasRole(role) {
        return this.roles.includes(role);
    }
}
