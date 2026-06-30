import { getApiErrorMessage } from '../infrastructure/api-error.js';

/** @returns {{ ok: true } & Record<string, unknown>} */
export function storeSuccess(extra = {}) {
    return { ok: true, ...extra };
}

/** @returns {{ ok: false, message: string }} */
export function storeFailure(err, fallback, restore) {
    if (typeof restore === 'function') restore();
    return { ok: false, message: getApiErrorMessage(err, fallback) };
}

/** @returns {{ ok: false, message: string }} */
export function storeFailureMessage(message, restore) {
    if (typeof restore === 'function') restore();
    return { ok: false, message };
}
