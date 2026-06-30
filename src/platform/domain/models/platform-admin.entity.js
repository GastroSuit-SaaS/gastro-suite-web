export class PlatformAdmin {
    constructor({
        userId = null,
        username = '',
        email = '',
        nombres = '',
        apellidos = '',
        tipoDocumento = '',
        numeroDocumento = '',
        telefono = '',
        active = true,
        createdAt = null,
    } = {}) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.tipoDocumento = tipoDocumento;
        this.numeroDocumento = numeroDocumento;
        this.telefono = telefono;
        this.active = active;
        this.createdAt = createdAt;
    }
}
