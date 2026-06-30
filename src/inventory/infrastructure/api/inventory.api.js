import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

export class InventoryApi extends BaseApi {
    #products;
    #categories;
    #movements;

    constructor() {
        super();
        this.#products    = new BaseEndpoint(this, apiEnv.inventoryProducts);
        this.#categories  = new BaseEndpoint(this, apiEnv.inventoryCategories);
        this.#movements   = new BaseEndpoint(this, apiEnv.inventoryMovements);
    }

    listProductsByBranch(branchId, params) {
        return this.#products.listAt(`/branches/${branchId}/inventory/products`, params);
    }

    listCategoriesByBranch(branchId, params) {
        return this.#categories.listAt(`/branches/${branchId}/inventory/categories`, params);
    }

    listMovementsByBranch(branchId, params) {
        return this.#movements.listAt(`/branches/${branchId}/inventory/movements`, params);
    }

    getProductById(id)              { return this.#products.getById(id); }
    createProduct(resource)         { return this.#products.create(resource); }
    updateProduct(id, resource)     { return this.#products.update(id, resource); }
    deleteProduct(id)               { return this.#products.delete(id); }

    createCategory(resource)        { return this.#categories.create(resource); }
    updateCategory(id, resource)    { return this.#categories.update(id, resource); }
    deleteCategory(id)              { return this.#categories.delete(id); }

    createMovement(resource)                { return this.#movements.create(resource); }
    updateMovement(id, resource)            { return this.#movements.update(id, resource); }
    deleteMovement(id)                      { return this.#movements.delete(id); }
}

export const inventoryApi = new InventoryApi();
