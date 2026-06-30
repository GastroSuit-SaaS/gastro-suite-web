/**
 * Operaciones HTTP reutilizables contra un path base de API.
 * Los módulos instancian una o más por recurso (ej. /menu-items, /zones).
 */
export class BaseEndpoint {
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }

    getAll(params) {
        return params
            ? this.http.get(this.endpointPath, { params })
            : this.http.get(this.endpointPath);
    }

    getById(id) {
        return this.http.get(`${this.endpointPath}/${id}`);
    }

    create(resource) {
        return this.http.post(this.endpointPath, resource);
    }

    /** PATCH parcial — alineado con el backend Spring. */
    update(id, resource) {
        if (id == null || id === '' || String(id) === 'null') {
            return Promise.reject(new Error('ID de recurso inválido para actualizar'));
        }
        return this.http.patch(`${this.endpointPath}/${id}`, resource);
    }

    delete(id) {
        return this.http.delete(`${this.endpointPath}/${id}`);
    }

    /** GET en ruta absoluta (listados por company/branch/zone, etc.). */
    listAt(path, params) {
        return params ? this.http.get(path, { params }) : this.http.get(path);
    }

    /** POST en ruta absoluta (acciones de dominio: open/close session, refunds, etc.). */
    postAt(path, resource) {
        return this.http.post(path, resource);
    }

    /** PATCH en sub-ruta del recurso (ej. /tables/{id}/status). */
    patchSub(id, suffix, resource) {
        const sub = suffix.startsWith('/') ? suffix : `/${suffix}`;
        return this.http.patch(`${this.endpointPath}/${id}${sub}`, resource);
    }

    /** POST en sub-ruta del recurso (ej. /pos/sales/{id}/dispatch-to-stations). */
    postSub(id, suffix, resource = {}) {
        const sub = suffix.startsWith('/') ? suffix : `/${suffix}`;
        return this.http.post(`${this.endpointPath}/${id}${sub}`, resource);
    }
}
