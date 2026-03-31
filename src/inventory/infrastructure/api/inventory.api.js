/**
 * Inventory Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Inventory.
 * Maneja endpoints de productos, stock, categorías, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class InventoryApi extends BaseApi {
    #endpoint;

    constructor() {
        super();
        // TODO: set the correct environment variable for this endpoint path
        this.#endpoint = new BaseEndpoint(this, import.meta.env.VITE_INVENTORY_ENDPOINT ?? '/inventory/products');
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

    updateStock(id, quantity) {
        return this.http.patch(`${import.meta.env.VITE_INVENTORY_ENDPOINT ?? '/inventory/products'}/${id}/stock`, { quantity });
    }

    getLowStock(threshold = 10) {
        return this.http.get(`${import.meta.env.VITE_INVENTORY_ENDPOINT ?? '/inventory/products'}/low-stock`, { params: { threshold } });
    }
}

export const inventoryApi = new InventoryApi();
