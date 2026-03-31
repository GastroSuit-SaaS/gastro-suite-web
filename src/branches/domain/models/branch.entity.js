/**
 * Branches Domain - Branch Entity
 *
 * Objeto de dominio puro.
 * Representa una sucursal de la empresa.
 */
export class Branch {
    constructor({
        id              = null,
        empresaId       = null,
        codigo          = '',
        nombre          = '',
        direccion       = '',
        departamento    = '',
        provincia       = '',
        distrito        = '',
        telefono        = '',
        email           = '',
        encargadoId     = null,
        encargadoNombre = '',
        isActive        = true,
        createdAt       = null,
    } = {}) {
        this.id              = id;
        this.empresaId       = empresaId;
        this.codigo          = codigo;
        this.nombre          = nombre;
        this.direccion       = direccion;
        this.departamento    = departamento;
        this.provincia       = provincia;
        this.distrito        = distrito;
        this.telefono        = telefono;
        this.email           = email;
        this.encargadoId     = encargadoId;
        this.encargadoNombre = encargadoNombre;
        this.isActive        = isActive;
        this.createdAt       = createdAt;
    }

    /** @returns {string} Dirección completa */
    get fullAddress() {
        return [this.direccion, this.distrito, this.provincia, this.departamento]
            .filter(Boolean)
            .join(', ');
    }

    /** @returns {string} Nombre para mostrar en selectores */
    get displayName() {
        return this.codigo ? `${this.codigo} — ${this.nombre}` : this.nombre;
    }
}
