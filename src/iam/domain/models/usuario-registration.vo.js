/**
 * IAM Domain — UsuarioRegistration Value Object
 *
 * Representa los datos capturados en el Step 3 del formulario de registro.
 * Objeto de dominio puro: sin dependencias Vue, sin HTTP.
 */

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{4,}$/

export class UsuarioRegistration {
    constructor({
        nombres         = '',
        apellidos       = '',
        username        = '',
        tipoDocumento   = '',
        numeroDocumento = '',
        email           = '',
        telefono        = '',
        password        = '',
        confirmPassword = '',
    } = {}) {
        this.nombres         = nombres
        this.apellidos       = apellidos
        this.username        = username
        this.tipoDocumento   = tipoDocumento
        this.numeroDocumento = numeroDocumento
        this.email           = email
        this.telefono        = telefono
        this.password        = password
        this.confirmPassword = confirmPassword
    }

    /**
     * Username válido: solo letras, números, puntos y guiones. Mínimo 4 caracteres.
     * @returns {boolean}
     */
    isUsernameValid() {
        return USERNAME_REGEX.test(this.username)
    }

    /**
     * Retorna un mapa campo → booleano indicando si ese campo tiene error.
     * @returns {{ nombres: boolean, apellidos: boolean, username: boolean, tipoDocumento: boolean, numeroDocumento: boolean, email: boolean, telefono: boolean, password: boolean, confirmPassword: boolean }}
     */
    validate() {
        return {
            nombres:         !this.nombres.trim(),
            apellidos:       !this.apellidos.trim(),
            username:        !this.isUsernameValid(),
            tipoDocumento:   !this.tipoDocumento,
            numeroDocumento: !this.numeroDocumento.trim(),
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

    /** @returns {string} Nombre completo del usuario */
    get fullName() {
        return `${this.nombres} ${this.apellidos}`.trim()
    }
}
