/**
 * IAM Domain - User Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class User {
    constructor({
        id          = null,
        username    = '',
        email       = '',
        roles       = [],
        isActive    = false,
    } = {}) {
        this.id       = id;
        this.username = username;
        this.email    = email;
        this.roles    = roles;
        this.isActive = isActive;
        // TODO: extend with additional domain fields (firstName, lastName, etc.)
    }
}
