import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

/** IAM: sign-in, sign-up y vínculo empleado bajo VITE_IAM_ENDPOINT (/auth). */
export class IamApi extends BaseApi {
    #auth;

    constructor() {
        super();
        this.#auth = new BaseEndpoint(this, apiEnv.iam);
    }

    signIn(credentials) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/sign-in`, credentials);
    }

    signUp(resource) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/sign-up`, resource);
    }

    /** POST /companies — público, onboarding paso 1. */
    createCompany(resource) {
        return this.http.post(apiEnv.companies, resource);
    }

    /** Crea o devuelve el empleado vinculado al usuario autenticado. */
    ensureEmployeeLink(resource) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/ensure-employee`, resource);
    }
}

export const iamApi = new IamApi();
