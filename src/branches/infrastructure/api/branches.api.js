/**
 * Branches Infrastructure - API Service
 *
 * Comunicación HTTP con el backend del módulo de Sucursales.
 */
import { BaseApi }      from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class BranchesApi extends BaseApi {
    #endpoint;

    constructor() {
        super();
        this.#endpoint = new BaseEndpoint(this, import.meta.env.VITE_BRANCHES_ENDPOINT ?? '/branches');
    }

    getAll()             { return this.#endpoint.getAll(); }
    getById(id)          { return this.#endpoint.getById(id); }
    create(resource)     { return this.#endpoint.create(resource); }
    update(id, resource) { return this.#endpoint.update(id, resource); }
    delete(id)           { return this.#endpoint.delete(id); }
}

export const branchesApi = new BranchesApi();
