/**
 * Normaliza colecciones devueltas por el backend (lista plana o paginada).
 * @param {unknown} data - response.data
 * @returns {Array}
 */
export function extractCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

/**
 * @param {unknown} data - response.data
 * @returns {Object|null}
 */
export function extractResource(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return data.data;
    }
    // Recurso único envuelto en "content" (algunos endpoints paginados mal interpretados)
    if (data.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
        return data.content;
    }
    return data;
}

/**
 * Mapea una respuesta Axios de listado a entidades de dominio.
 * @param {import('axios').AxiosResponse} response
 * @param {(raw: Object) => unknown} toEntity
 * @param {number[]} [okStatuses=[200]]
 * @returns {Array}
 */
export function entitiesFromResponse(response, toEntity, okStatuses = [200]) {
    if (!response || !okStatuses.includes(response.status)) return [];
    return extractCollection(response.data).map((raw) => toEntity(raw));
}

/**
 * Mapea una respuesta Axios de detalle a una entidad.
 * @param {import('axios').AxiosResponse} response
 * @param {(raw: Object) => unknown} toEntity
 * @param {number[]} [okStatuses=[200, 201]]
 * @returns {unknown|null}
 */
export function entityFromResponse(response, toEntity, okStatuses = [200, 201]) {
    if (!response || !okStatuses.includes(response.status)) return null;
    const raw = extractResource(response.data);
    return raw ? toEntity(raw) : null;
}
