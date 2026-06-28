import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { NotificationsApi } from '../infrastructure/api/notifications.api.js';
import { PushTokensApi } from '../infrastructure/api/push-tokens.api.js';
import { NotificationAssembler } from '../infrastructure/assemblers/notification.assembler.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';
import { tryObtainFcmWebToken } from '../infrastructure/push/fcm-web.client.js';

const api = new NotificationsApi();
const pushApi = new PushTokensApi();

const POLL_MS = 60_000;

export const useNotificationsStore = defineStore('notifications', () => {
    const items = ref([]);
    const unreadCount = ref(0);
    const isLoading = ref(false);
    const isPanelOpen = ref(false);
    const error = ref(null);
    const pushRegistered = ref(false);

    let pollTimer = null;

    const hasUnread = computed(() => unreadCount.value > 0);

    function _requireUserId() {
        const userId = useIamStore().currentUser?.id;
        if (userId == null) {
            throw new Error('Usuario no disponible para notificaciones.');
        }
        return userId;
    }

    async function fetchUnreadCount() {
        try {
            _requireUserId();
            const response = await api.unreadCount();
            unreadCount.value = response.data?.count ?? 0;
        } catch {
            /* badge opcional; no bloquear UI */
        }
    }

    async function fetchNotifications() {
        isLoading.value = true;
        error.value = null;
        try {
            _requireUserId();
            const response = await api.list();
            items.value = NotificationAssembler.toEntitiesFromResponse(response);
            unreadCount.value = items.value.filter((n) => n.isUnread).length;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar notificaciones');
            items.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function markAsRead(notificationId) {
        try {
            _requireUserId();
            await api.markAsRead(notificationId);
            const item = items.value.find((n) => n.id === notificationId);
            if (item) {
                item.status = 'READ';
                item.readAt = new Date().toISOString();
            }
            unreadCount.value = Math.max(0, unreadCount.value - 1);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo marcar como leída');
        }
    }

    async function markAllAsRead() {
        try {
            _requireUserId();
            await api.markAllAsRead();
            items.value.forEach((n) => {
                n.status = 'READ';
            });
            unreadCount.value = 0;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron marcar todas como leídas');
        }
    }

    async function registerPushTokenIfAvailable() {
        if (pushRegistered.value) return;
        try {
            _requireUserId();
            const token = await tryObtainFcmWebToken();
            if (!token) return;
            await pushApi.register({ token, platform: 'WEB' });
            pushRegistered.value = true;
        } catch {
            /* push opcional */
        }
    }

    async function unregisterPushToken(token) {
        if (!token) return;
        try {
            _requireUserId();
            await pushApi.unregister({ token });
        } catch {
            /* best effort al cerrar sesión */
        } finally {
            pushRegistered.value = false;
        }
    }

    function startPolling() {
        stopPolling();
        pollTimer = setInterval(() => {
            fetchUnreadCount();
            if (isPanelOpen.value) fetchNotifications();
        }, POLL_MS);
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    async function refresh() {
        await Promise.all([fetchUnreadCount(), fetchNotifications()]);
    }

    function $reset() {
        stopPolling();
        items.value = [];
        unreadCount.value = 0;
        isLoading.value = false;
        isPanelOpen.value = false;
        error.value = null;
        pushRegistered.value = false;
    }

    return {
        items,
        unreadCount,
        isLoading,
        isPanelOpen,
        error,
        hasUnread,
        pushRegistered,
        fetchUnreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        registerPushTokenIfAvailable,
        unregisterPushToken,
        startPolling,
        stopPolling,
        refresh,
        $reset,
    };
});
