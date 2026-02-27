/**
 * Users Domain - UserProfile Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class UserProfile {
    constructor({
        id         = null,
        firstName  = '',
        lastName   = '',
        email      = '',
        phone      = '',
        roleId     = null,
        isActive   = false,
        createdAt  = null,
    } = {}) {
        this.id        = id;
        this.firstName = firstName;
        this.lastName  = lastName;
        this.email     = email;
        this.phone     = phone;
        this.roleId    = roleId;
        this.isActive  = isActive;
        this.createdAt = createdAt;
        // TODO: extend with additional domain fields (avatar, preferences, etc.)
    }
}
