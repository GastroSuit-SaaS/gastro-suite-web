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
        email           = '',
        telefono        = '',
        password        = '',
        confirmPassword = '',
    } = {}) {
        this.ruc             = ruc
        this.razonSocial     = razonSocial
        this.nombreComercial = nombreComercial
        this.email           = email
        this.telefono        = telefono
        this.password        = password
        this.confirmPassword = confirmPassword
    }

    /**
     * Retorna un mapa campo → booleano indicando si ese campo tiene error.
     * true  = hay error
     * false = campo válido
     * @returns {{ ruc: boolean, razonSocial: boolean, nombreComercial: boolean, email: boolean, telefono: boolean, password: boolean, confirmPassword: boolean }}
     */
    validate() {
        return {
            ruc:             this.ruc.trim().length !== 11,
            razonSocial:     !this.razonSocial.trim(),
            nombreComercial: !this.nombreComercial.trim(),
            email:           !this.email.trim(),
            telefono:        !this.telefono.trim(),
            password:        this.password.length < 8,
            confirmPassword: this.password !== this.confirmPassword,
        }
    }

    /** @returns {boolean} true si todos los campos son válidos */
    isValid() {
        return Object.values(this.validate()).every(v => !v)
    }
}
