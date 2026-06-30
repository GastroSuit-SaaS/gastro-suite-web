import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

export class MenuApi extends BaseApi {
    #items;
    #categories;

    constructor() {
        super();
        this.#items = new BaseEndpoint(this, apiEnv.menuItems);
        this.#categories = new BaseEndpoint(this, apiEnv.menuCategories);
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

    /** PATCH multipart — campo `image` según MenuItemBffController.uploadImage */
    uploadItemImage(itemId, imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        return this.http.patch(`${apiEnv.menuItems}/${itemId}/image`, formData);
    }

    createCategory(resource)         { return this.#categories.create(resource); }
    updateCategory(id, resource)     { return this.#categories.update(id, resource); }
    deleteCategory(id)               { return this.#categories.delete(id); }
}

export const menuApi = new MenuApi();
