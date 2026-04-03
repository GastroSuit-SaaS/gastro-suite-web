import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class CashRegisterApi extends BaseApi {
    #endpoint;
    #sessionsPath;

    constructor() {
        super();
        this.#endpoint     = new BaseEndpoint(this, import.meta.env.VITE_CASH_REGISTER_ENDPOINT ?? '/cash-register/movements');
        this.#sessionsPath = import.meta.env.VITE_CASH_REGISTER_SESSIONS_ENDPOINT ?? '/cash-register/sessions';
    }

    getAll() {
        return this.#endpoint.getAll();
    }

    getById(id) {
        return this.#endpoint.getById(id);
    }

    create(resource) {
        return this.#endpoint.create(resource);
    }

    update(id, resource) {
        return this.#endpoint.update(id, resource);
    }

    delete(id) {
        return this.#endpoint.delete(id);
    }

    // ── Session (turno) endpoints ───────────────────────────────
    getCurrentSession() {
        return this.http.get(`${this.#sessionsPath}/current`);
    }

    openSession(data) {
        return this.http.post(`${this.#sessionsPath}/open`, data);
    }

    closeSession(id, data) {
        return this.http.post(`${this.#sessionsPath}/${id}/close`, data);
    }

    getAllSessions(params) {
        return this.http.get(this.#sessionsPath, { params });
    }
}
