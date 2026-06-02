import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Estado de conectividad del navegador (online / offline).
 */
export function useNetworkStatus() {
    const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const lastOnlineAt = ref(Date.now());

    function handleOnline() {
        isOnline.value = true;
        lastOnlineAt.value = Date.now();
        window.dispatchEvent(new CustomEvent('gastro:network-online'));
    }

    function handleOffline() {
        isOnline.value = false;
        window.dispatchEvent(new CustomEvent('gastro:network-offline'));
    }

    onMounted(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
    });

    onUnmounted(() => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    });

    return { isOnline, lastOnlineAt };
}
