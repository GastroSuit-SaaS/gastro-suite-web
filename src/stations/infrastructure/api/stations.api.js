import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class StationsApi extends BaseApi {
    #stations;
    #tickets;

    constructor() {
        super();
        this.#stations = new BaseEndpoint(this, import.meta.env.VITE_STATIONS_ENDPOINT ?? '/stations');
        this.#tickets  = new BaseEndpoint(this, import.meta.env.VITE_TICKETS_ENDPOINT ?? '/pos/tickets');
    }

    listStationsByBranch(branchId) {
        return this.#stations.listAt(`/branches/${branchId}/stations`);
    }

    listTicketsByBranch(branchId, params) {
        return this.#tickets.listAt(`/branches/${branchId}/pos/tickets`, params);
    }

    createStation(resource)       { return this.#stations.create(resource); }
    updateStation(id, resource)   { return this.#stations.update(id, resource); }
    deleteStation(id)             { return this.#stations.delete(id); }

    getTicket(ticketId)           { return this.#tickets.getById(ticketId); }
    updateTicket(ticketId, body)  { return this.#tickets.update(ticketId, body); }
    createTicket(resource)        { return this.#tickets.create(resource); }
}

export const stationsApi = new StationsApi();
