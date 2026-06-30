import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { NotificationsApi } from '../infrastructure/api/notifications.api.js';
import { PushTokensApi } from '../infrastructure/api/push-tokens.api.js';
import { NotificationAssembler } from '../infrastructure/assemblers/notification.assembler.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { tryObtainFcmWebToken } from '../infrastructure/push/fcm-web.client.js';
import {
    getUserNotificationsSocketClient,
    resetUserNotificationsSocketClient,
} from '../infrastructure/realtime/user-notifications-socket.js';
import { SESSION_KEYS } from '../../shared/infrastructure/session-storage.js';

const api = new NotificationsApi();
const pushApi = new PushTokensApi();

/** Respaldo si el WebSocket no está conectado. */
const POLL_MS = 20_000;
const PAGE_SIZE = 20;

export const useCommunicationStore = defineStore('communication', () => {
    const items = ref([]);
    const totalElements = ref(0);
    const hasMore = ref(false);
    const isLoadingMore = ref(false);
    const unreadCount = ref(0);
    const isLoading = ref(false);
    const isPanelOpen = ref(false);
    const error = ref(null);
    const pushRegistered = ref(false);
    const fcmToken = ref(null);

    let pollTimer = null;
    let visibilityHandler = null;
    let lastUnreadCount = 0;
    let socketClient = null;
    let currentPage = 0;

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
            const nextCount = response.data?.unreadCount ?? response.data?.count ?? 0;
            if (nextCount > lastUnreadCount) {
                window.dispatchEvent(new CustomEvent('gastro:notifications-updated', {
                    detail: { unreadCount: nextCount },
                }));
            }
            lastUnreadCount = nextCount;
            unreadCount.value = nextCount;
        } catch {
            /* badge opcional; no bloquear UI */
        }
    }

    async function fetchNotifications({ reset = true } = {}) {
        if (reset) {
            isLoading.value = true;
            currentPage = 0;
        } else {
            isLoadingMore.value = true;
        }
        error.value = null;
        try {
            _requireUserId();
            const response = await api.list({ page: currentPage, size: PAGE_SIZE });
            const page = NotificationAssembler.toPageFromResponse(response);
            items.value = reset ? page.content : [...items.value, ...page.content];
            totalElements.value = page.totalElements;
            hasMore.value = page.hasNext;
            currentPage = page.currentPage;
            if (!reset) {
                _syncUnreadCount();
            } else {
                _syncUnreadCount();
            }
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar notificaciones');
            if (reset) {
                items.value = [];
                totalElements.value = 0;
                hasMore.value = false;
            }
        } finally {
            isLoading.value = false;
            isLoadingMore.value = false;
        }
    }

    async function loadMoreNotifications() {
        if (!hasMore.value || isLoadingMore.value || isLoading.value) return;
        currentPage += 1;
        await fetchNotifications({ reset: false });
    }

    function _syncUnreadCount() {
        unreadCount.value = items.value.filter((n) => n.isUnread).length;
        lastUnreadCount = unreadCount.value;
    }

    async function markAsRead(notificationId) {
        try {
            _requireUserId();
            await api.markAsRead(notificationId);
            const item = items.value.find((n) => n.id === notificationId);
            if (item?.isUnread) {
                item.status = 'READ';
                item.readAt = new Date().toISOString();
                unreadCount.value = Math.max(0, unreadCount.value - 1);
                lastUnreadCount = unreadCount.value;
            }
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo marcar como leída');
        }
    }

    async function markAsUnread(notificationId) {
        try {
            _requireUserId();
            await api.markAsUnread(notificationId);
            const item = items.value.find((n) => n.id === notificationId);
            if (item && !item.isUnread) {
                item.status = 'UNREAD';
                item.readAt = null;
                unreadCount.value += 1;
                lastUnreadCount = unreadCount.value;
            }
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo marcar como no leída');
        }
    }

    async function toggleReadStatus(notificationId) {
        const item = items.value.find((n) => n.id === notificationId);
        if (!item) return;
        if (item.isUnread) {
            await markAsRead(notificationId);
        } else {
            await markAsUnread(notificationId);
        }
    }

    async function deleteNotification(notificationId) {
        try {
            _requireUserId();
            const item = items.value.find((n) => n.id === notificationId);
            await api.deleteNotification(notificationId);
            items.value = items.value.filter((n) => n.id !== notificationId);
            totalElements.value = Math.max(0, totalElements.value - 1);
            if (item?.isUnread) {
                unreadCount.value = Math.max(0, unreadCount.value - 1);
            }
            lastUnreadCount = unreadCount.value;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo eliminar la notificación');
        }
    }

    async function deleteNotifications(notificationIds) {
        if (!notificationIds?.length) return;
        try {
            _requireUserId();
            const idSet = new Set(notificationIds);
            const removedUnread = items.value.filter((n) => idSet.has(n.id) && n.isUnread).length;
            await api.deleteNotifications(notificationIds);
            items.value = items.value.filter((n) => !idSet.has(n.id));
            totalElements.value = Math.max(0, totalElements.value - notificationIds.length);
            unreadCount.value = Math.max(0, unreadCount.value - removedUnread);
            lastUnreadCount = unreadCount.value;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron eliminar las notificaciones');
            throw e;
        }
    }

    async function deleteAllNotifications() {
        try {
            _requireUserId();
            await api.deleteAllNotifications();
            items.value = [];
            totalElements.value = 0;
            hasMore.value = false;
            currentPage = 0;
            unreadCount.value = 0;
            lastUnreadCount = 0;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron eliminar todas las notificaciones');
            throw e;
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
            lastUnreadCount = 0;
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
            fcmToken.value = token;
            pushRegistered.value = true;
            if (import.meta.env.DEV) {
                console.info('[GastroSuite FCM] Token registrado en el API');
            }
        } catch (e) {
            if (import.meta.env.DEV) {
                console.warn('[GastroSuite FCM] No se pudo registrar el token:', e?.response?.data?.message ?? e?.message ?? e);
            }
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

    async function _dispatchInAppNotification(payload) {
        const entity = NotificationAssembler.toEntityFromResource(payload);
        if (!entity?.title) return;
        window.dispatchEvent(new CustomEvent('gastro:in-app-notification', {
            detail: {
                id: entity.id,
                title: entity.title,
                body: entity.body,
            },
        }));
    }

    async function _onRealtimeNotification(payload) {
        if (payload) {
            await _dispatchInAppNotification(payload);
        }
        const previous = lastUnreadCount;
        await fetchUnreadCount();
        window.dispatchEvent(new CustomEvent('gastro:notifications-updated', {
            detail: { unreadCount: unreadCount.value, source: 'realtime' },
        }));
        if (isPanelOpen.value || unreadCount.value > previous) {
            await fetchNotifications({ reset: true });
        }
    }

    function startRealtimeSubscription() {
        const userId = useIamStore().currentUser?.id;
        const token = localStorage.getItem(SESSION_KEYS.TOKEN);
        if (!userId || !token) return;

        if (!socketClient) {
            socketClient = getUserNotificationsSocketClient({
                onMessage: (payload) => { _onRealtimeNotification(payload); },
            });
        }
        socketClient.connect(userId, token);
    }

    function stopRealtimeSubscription() {
        resetUserNotificationsSocketClient();
        socketClient = null;
    }

    function startPolling() {
        stopPolling();
        startRealtimeSubscription();
        fetchUnreadCount();

        pollTimer = setInterval(() => {
            fetchUnreadCount();
            if (isPanelOpen.value) fetchNotifications({ reset: true });
        }, POLL_MS);

        if (!visibilityHandler) {
            visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                    fetchUnreadCount();
                    startRealtimeSubscription();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
        }
    }

    function stopPolling() {
        stopRealtimeSubscription();
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler);
            visibilityHandler = null;
        }
    }

    async function refresh() {
        await Promise.all([fetchUnreadCount(), fetchNotifications()]);
    }

    async function cleanupBeforeLogout() {
        stopPolling();
        const token = fcmToken.value;
        if (token) {
            await unregisterPushToken(token);
        }
        fcmToken.value = null;
    }

    function $reset() {
        stopPolling();
        items.value = [];
        totalElements.value = 0;
        hasMore.value = false;
        currentPage = 0;
        unreadCount.value = 0;
        lastUnreadCount = 0;
        isLoading.value = false;
        isPanelOpen.value = false;
        error.value = null;
        pushRegistered.value = false;
        fcmToken.value = null;
    }

    return {
        items,
        totalElements,
        hasMore,
        isLoadingMore,
        unreadCount,
        isLoading,
        isPanelOpen,
        error,
        hasUnread,
        pushRegistered,
        fetchUnreadCount,
        fetchNotifications,
        loadMoreNotifications,
        markAsRead,
        markAsUnread,
        toggleReadStatus,
        deleteNotification,
        deleteNotifications,
        deleteAllNotifications,
        markAllAsRead,
        registerPushTokenIfAvailable,
        unregisterPushToken,
        cleanupBeforeLogout,
        startPolling,
        stopPolling,
        refresh,
        $reset,
    };
});
