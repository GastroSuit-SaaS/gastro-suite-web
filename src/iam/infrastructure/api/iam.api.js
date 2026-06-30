import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

/** IAM: sign-in, register-owner y vínculo empleado bajo VITE_IAM_ENDPOINT (/auth). */
export class IamApi extends BaseApi {
    #auth;

    constructor() {
        super();
        this.#auth = new BaseEndpoint(this, apiEnv.iam);
    }

    signIn(credentials) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/sign-in`, credentials);
    }

    /** POST /auth/register-owner — empresa + usuario + empleado atómicos (SAGA). */
    registerOwner(resource) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/register-owner`, resource);
    }

    /** POST /auth/registration/send-verification-code — código 6 dígitos al correo del OWNER. */
    sendRegistrationVerificationCode(email) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/registration/send-verification-code`, { email });
    }

    /** Crea o devuelve el empleado vinculado al usuario autenticado. */
    ensureEmployeeLink(resource) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/ensure-employee`, resource);
    }

    forgotPassword(email) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/forgot-password`, { email });
    }

    verifyPasswordResetCode(email, verificationCode) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/reset-password/verify-code`, {
            email,
            verificationCode,
        });
    }

    resetPassword(email, password) {
        return this.#auth.postAt(`${this.#auth.endpointPath}/reset-password`, {
            email,
            password,
        });
    }
}

export const iamApi = new IamApi();
