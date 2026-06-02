/**
 * Logger ligero para la app. En producción solo warn/error; en desarrollo también debug.
 */

const isDev = import.meta.env.DEV;

function formatMeta(meta) {
    if (meta === undefined || meta === null) return '';
    if (meta instanceof Error) {
        return { message: meta.message, stack: meta.stack };
    }
    return meta;
}

export const appLogger = {
    debug(scope, message, meta) {
        if (!isDev) return;
        console.debug(`[${scope}]`, message, formatMeta(meta));
    },

    info(scope, message, meta) {
        console.info(`[${scope}]`, message, formatMeta(meta));
    },

    warn(scope, message, meta) {
        console.warn(`[${scope}]`, message, formatMeta(meta));
    },

    error(scope, message, meta) {
        console.error(`[${scope}]`, message, formatMeta(meta));
    },
};
