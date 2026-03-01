/**
 * IAM Domain — SucursalRegistration Value Object
 *
 * Representa los datos capturados en el Step 2 del formulario de registro.
 * Objeto de dominio puro: sin dependencias Vue, sin HTTP.
 */
export class SucursalRegistration {
    constructor({
        codigo       = '',
        nombre       = '',
        direccion    = '',
        departamento = '',
        provincia    = '',
        distrito     = '',
    } = {}) {
        this.codigo       = codigo
        this.nombre       = nombre
        this.direccion    = direccion
        this.departamento = departamento
        this.provincia    = provincia
        this.distrito     = distrito
    }

    /**
     * Retorna un mapa campo → booleano indicando si ese campo tiene error.
     * @returns {{ codigo: boolean, nombre: boolean, direccion: boolean, departamento: boolean, provincia: boolean, distrito: boolean }}
     */
    validate() {
        return {
            codigo:       !this.codigo.trim(),
            nombre:       !this.nombre.trim(),
            direccion:    !this.direccion.trim(),
            departamento: !this.departamento,
            provincia:    !this.provincia,
            distrito:     !this.distrito,
        }
    }

    /** @returns {boolean} true si todos los campos son válidos */
    isValid() {
        return Object.values(this.validate()).every(v => !v)
    }
}
