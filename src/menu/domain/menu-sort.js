/**
 * Orden de aparición de categorías (categorySortOrder en API, > 0).
 */
export function compareBySortOrder(a, b) {
    const orderA = Number(a?.sortOrder) || 0;
    const orderB = Number(b?.sortOrder) || 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'es');
}

export function sortBySortOrder(list) {
    return [...list].sort(compareBySortOrder);
}

export function nextSortOrder(categories) {
    const max = (categories ?? []).reduce(
        (m, c) => Math.max(m, Number(c?.sortOrder) || 0),
        0,
    );
    return max + 1;
}

export function formatCategoryOptionLabel(cat) {
    const order = Number(cat?.sortOrder);
    const prefix = order > 0 ? `${order}. ` : '';
    return `${prefix}${cat?.name ?? ''}`;
}
