import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class MenuApi extends BaseApi {
    #endpoint;
    #categoriesPath;

    constructor() {
        super();
        this.#endpoint       = new BaseEndpoint(this, import.meta.env.VITE_MENU_ENDPOINT ?? '/menu/items');
        this.#categoriesPath = import.meta.env.VITE_CATEGORIES_ENDPOINT ?? '/menu/categories';
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

    // ── Categories ────────────────────────────────────────────────────────
    getCategories() {
        return this.http.get(this.#categoriesPath);
    }

    createCategory(data) {
        return this.http.post(this.#categoriesPath, data);
    }

    updateCategory(id, data) {
        return this.http.put(`${this.#categoriesPath}/${id}`, data);
    }

    deleteCategory(id) {
        return this.http.delete(`${this.#categoriesPath}/${id}`);
    }
}

export const menuApi = new MenuApi();
