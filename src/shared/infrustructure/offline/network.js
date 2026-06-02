/** @returns {boolean} */
export function isNetworkOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function notifyOutboxChanged() {
    window.dispatchEvent(new CustomEvent('gastro:outbox-changed'));
}
