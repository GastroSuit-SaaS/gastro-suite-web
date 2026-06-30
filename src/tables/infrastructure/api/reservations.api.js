import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

export class ReservationsApi extends BaseApi {
    #root;

    constructor() {
        super();
        this.#root = new BaseEndpoint(this, '');
    }

    listByBranch(branchId, date) {
        const params = date ? { date } : undefined;
        return this.#root.listAt(`/branches/${branchId}/reservations`, params);
    }

    create(branchId, body) {
        return this.#root.postAt(`/branches/${branchId}/reservations`, body);
    }

    cancel(reservationId) {
        return this.#root.postAt(`${apiEnv.reservations}/${reservationId}/cancel`, {});
    }

    checkIn(reservationId, body = {}) {
        return this.#root.postAt(`${apiEnv.reservations}/${reservationId}/check-in`, body);
    }
}

export const reservationsApi = new ReservationsApi();
