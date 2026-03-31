/**
 * IAM Domain — EmpresaRegistration Value Object
 *
 * Representa los datos capturados en el Step 1 del formulario de registro.
 * Objeto de dominio puro: sin dependencias Vue, sin HTTP.
 *
 * Por qué Value Object y no Entity:
 *   - No tiene identidad propia (sin ID) hasta que el backend la crea.
 *   - Es inmutable en concepto: representa la intención de registrar,
 *     no una empresa ya persistida.
 */
export class EmpresaRegistration {
    constructor({
        ruc             = '',
        razonSocial     = '',
        nombreComercial = '',
        direccion       = '',
    } = {}) {
        this.ruc             = ruc
        this.razonSocial     = razonSocial
        this.nombreComercial = nombreComercial
        this.direccion       = direccion
    }

    /**
     * Retorna un mapa campo → booleano indicando si ese campo tiene error.
     * true  = hay error
     * false = campo válido
     * @returns {{ ruc: boolean, razonSocial: boolean, nombreComercial: boolean, direccion: boolean }}
     */
    validate() {
        return {
            ruc:             this.ruc.trim().length !== 11,
            razonSocial:     !this.razonSocial.trim(),
            nombreComercial: !this.nombreComercial.trim(),
            direccion:       !this.direccion.trim(),
        }
    }

    /** @returns {boolean} true si todos los campos son válidos */
    isValid() {
        return Object.values(this.validate()).every(v => !v)
    }
}
