import { onMounted, onUnmounted } from 'vue';
import { useNotification } from './use-notification.js';

/**
 * Muestra toasts PrimeVue (top-right) cuando llega una notificación in-app vía STOMP o FCM.
 */
export function useInAppNotificationToasts() {
    const { showInfo } = useNotification();
    let lastShownId = null;

    function onInAppNotification(event) {
        const { title, body, id } = event.detail ?? {};
        if (!title) return;
        if (id != null && id === lastShownId) return;
        lastShownId = id ?? null;

        showInfo(body || '', title, 6000);
    }

    onMounted(() => {
        window.addEventListener('gastro:in-app-notification', onInAppNotification);
    });

    onUnmounted(() => {
        window.removeEventListener('gastro:in-app-notification', onInAppNotification);
    });
}
