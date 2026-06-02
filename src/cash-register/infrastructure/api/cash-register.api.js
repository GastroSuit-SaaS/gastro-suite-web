import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

export class CashRegisterApi extends BaseApi {
    #movements;
    #sessions;

    constructor() {
        super();
        this.#movements = new BaseEndpoint(this, apiEnv.cashMovements);
        this.#sessions  = new BaseEndpoint(this, apiEnv.cashSessions);
    }

    listSessionsByBranch(branchId, params) {
        return this.#sessions.listAt(`/branches/${branchId}/cash-register/sessions`, params);
    }

    getOpenSessionByBranch(branchId) {
        return this.#sessions.listAt(`/branches/${branchId}/cash-register/sessions/open`);
    }

    getCollectorSummary(sessionId) {
        return this.http.get(`/cash-register/sessions/${sessionId}/collectors-summary`);
    }

    listMovementsByBranch(branchId, params) {
        return this.#movements.listAt(`/branches/${branchId}/cash-register/movements`, params);
    }

    openSession(data) {
        return this.#sessions.postAt(`${this.#sessions.endpointPath}/open`, data);
    }

    closeSession(data) {
        return this.#sessions.postAt(`${this.#sessions.endpointPath}/close`, data);
    }

    getSessionById(sessionId)           { return this.#sessions.getById(sessionId); }
    createMovement(resource)            { return this.#movements.create(resource); }
    updateMovement(id, resource)        { return this.#movements.update(id, resource); }
    deleteMovement(id)                  { return this.#movements.delete(id); }
}

export const cashRegisterApi = new CashRegisterApi();
