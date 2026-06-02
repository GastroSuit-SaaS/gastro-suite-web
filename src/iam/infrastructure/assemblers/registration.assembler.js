/**
 * Mapeo del wizard de registro → DTOs del API (companies, auth).
 */

export class RegistrationAssembler {

    static toCreateCompanyRequest(empresa) {
        if (!empresa?.ruc || !empresa?.razonSocial || !empresa?.nombreComercial || !empresa?.direccion) {
            throw new Error('Faltan datos de la empresa. Vuelve al paso 1 y complétalos.');
        }
        return {
            companyRuc: String(empresa.ruc).trim(),
            companyName: String(empresa.razonSocial).trim(),
            companyTradeName: String(empresa.nombreComercial).trim(),
            companyAddress: String(empresa.direccion).trim(),
        };
    }

    static toSignUpRequest(usuario) {
        return {
            username: usuario.username,
            password: usuario.password,
            isActive: true,
            roles: ['OWNER'],
        };
    }

}
