/**
 * IAM Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo IAM.
 * Maneja autenticación, autorización y gestión de identidad.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class IamApi extends BaseApi {
    #endpoint;

    constructor() {
        super();
        // TODO: set the correct environment variable for this endpoint path
        this.#endpoint = new BaseEndpoint(this, import.meta.env.VITE_IAM_ENDPOINT ?? '/auth');
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

    // TODO: add auth-specific methods (login, logout, register, refreshToken)
}

export const iamApi = new IamApi();
