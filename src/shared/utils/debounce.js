/**
 * Retorna una función que ejecuta `fn` tras `waitMs` sin nuevas invocaciones.
 * @param {(...args: unknown[]) => void} fn
 * @param {number} waitMs
 */
export function debounce(fn, waitMs) {
    let timer = null;
    return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...args);
        }, waitMs);
    };
}
