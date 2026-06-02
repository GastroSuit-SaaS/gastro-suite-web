import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class MenuApi extends BaseApi {
    #items;
    #categories;

    constructor() {
        super();
        this.#items = new BaseEndpoint(this, import.meta.env.VITE_MENU_ENDPOINT ?? '/menu-items');
        this.#categories = new BaseEndpoint(this, import.meta.env.VITE_CATEGORIES_ENDPOINT ?? '/menu-categories');
    }

    listItemsByBranch(branchId, params) {
        return this.#items.listAt(`/branches/${branchId}/menu-items`, params);
    }

    listCategoriesByBranch(branchId, params) {
        return this.#categories.listAt(`/branches/${branchId}/menu-categories`, params);
    }

    getItemById(itemId)              { return this.#items.getById(itemId); }
    createItem(resource)             { return this.#items.create(resource); }
    updateItem(itemId, resource)     { return this.#items.update(itemId, resource); }
    deleteItem(itemId)               { return this.#items.delete(itemId); }

    createCategory(resource)         { return this.#categories.create(resource); }
    updateCategory(id, resource)     { return this.#categories.update(id, resource); }
    deleteCategory(id)               { return this.#categories.delete(id); }
}

export const menuApi = new MenuApi();
