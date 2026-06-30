import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';
import { TableAssembler } from '../assemblers/table.assembler.js';

export class TablesApi extends BaseApi {
    #tables;
    #zones;

    constructor() {
        super();
        this.#tables = new BaseEndpoint(this, apiEnv.tables);
        this.#zones  = new BaseEndpoint(this, apiEnv.zones);
    }

    listZonesByBranch(branchId) {
        return this.#zones.listAt(`/branches/${branchId}/zones`);
    }

    listTablesByZone(zoneId) {
        return this.#tables.listAt(`/zones/${zoneId}/tables`);
    }

    getTableById(tableId)           { return this.#tables.getById(tableId); }
    createTable(resource)           { return this.#tables.create(resource); }
    updateTable(id, resource)       { return this.#tables.update(id, resource); }
    deleteTable(id)                 { return this.#tables.delete(id); }

    updateStatus(id, status) {
        return this.#tables.update(id, TableAssembler.toStatusPatch({ status }));
    }

    assign(id, { seatedGuests }) {
        return this.#tables.update(id, TableAssembler.toStatusPatch({
            status: 'occupied',
            seatedGuests,
        }));
    }

    free(id) {
        return this.#tables.update(id, TableAssembler.toStatusPatch({
            status: 'cleaning',
            seatedGuests: 0,
            occupiedSince: null,
        }));
    }

    createZone(resource)            { return this.#zones.create(resource); }
    updateZone(id, resource)        { return this.#zones.update(id, resource); }
    deleteZone(id)                  { return this.#zones.delete(id); }
}

export const tablesApi = new TablesApi();
