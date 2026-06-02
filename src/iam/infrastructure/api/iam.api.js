import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

/** IAM: sin CRUD de recurso; solo auth y registro (support). */
export class IamApi extends BaseApi {
    #auth;

    constructor() {
        super();
        const authPath = import.meta.env.VITE_IAM_ENDPOINT ?? '/auth';
        this.#auth = new BaseEndpoint(this, authPath);
    }

    signIn(credentials) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/sign-in`, credentials);
    }

    signUp(resource) {
        const supportPath = import.meta.env.VITE_AUTH_SUPPORT_ENDPOINT;
        if (!supportPath) {
            return Promise.reject(new Error('Registro no disponible: falta VITE_AUTH_SUPPORT_ENDPOINT'));
        }
        return this.#auth.postAt(`${supportPath}/sign-up`, resource);
    }

    /** POST /companies — público, onboarding paso 1. */
    createCompany(resource) {
        return this.http.post('/companies', resource);
    }

    /**
     * POST /support/employees — requiere JWT (tras sign-in).
     * Vincula usuario OWNER existente con la empresa (perfil dev).
     */
    createOwnerEmployee(resource) {
        return this.http.post('/support/employees', resource);
    }

    /** Crea o devuelve el empleado vinculado al usuario autenticado. */
    ensureEmployeeLink(resource) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/ensure-employee`, resource);
    }
}

export const iamApi = new IamApi();
