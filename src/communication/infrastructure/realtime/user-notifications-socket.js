import { Client } from '@stomp/stompjs';
import { apiEnv, getPlatformApiUrl } from '../../../shared/infrastructure/env.js';

const DEFAULT_WS_URL = 'ws://localhost:8080/ws/operational';

function resolveWsUrl() {
    if (apiEnv.wsOperationalUrl) return apiEnv.wsOperationalUrl;

    const api = getPlatformApiUrl();
    try {
        const url = new URL(api);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = url.host;
        const basePath = url.pathname.replace(/\/api\/v1\/?$/, '');
        return `${protocol}//${host}${basePath}/ws/operational`;
    } catch {
        return DEFAULT_WS_URL;
    }
}

export function userNotificationsTopic(userId) {
    return `/topic/users/${userId}/notifications`;
}

/**
 * STOMP ligero: solo el canal de notificaciones del usuario autenticado.
 */
export class UserNotificationsSocketClient {
    #client = null;
    #userId = null;
    #onMessage = null;
    #reconnectAttempt = 0;
    #maxReconnectDelayMs = 30_000;

    constructor({ onMessage }) {
        this.#onMessage = onMessage ?? (() => {});
    }

    connect(userId, token) {
        if (!userId || !token) return;

        if (this.#userId === userId && this.#client?.active) {
            return;
        }

        this.disconnect();
        this.#userId = userId;
        this.#reconnectAttempt = 0;

        this.#client = new Client({
            brokerURL: resolveWsUrl(),
            reconnectDelay: 0,
            heartbeatIncoming: 20_000,
            heartbeatOutgoing: 20_000,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => this.#handleConnect(),
            onStompError: () => this.#scheduleReconnect(token),
            onWebSocketClose: () => this.#scheduleReconnect(token),
        });

        this.#client.activate();
    }

    disconnect() {
        if (this.#client) {
            try {
                this.#client.deactivate();
            } catch { /* ok */ }
            this.#client = null;
        }
        this.#userId = null;
    }

    #handleConnect() {
        this.#reconnectAttempt = 0;
        if (!this.#client?.connected || !this.#userId) return;

        const destination = userNotificationsTopic(this.#userId);
        this.#client.subscribe(destination, (message) => {
            let payload = null;
            try {
                payload = message.body ? JSON.parse(message.body) : null;
            } catch {
                payload = null;
            }
            this.#onMessage(payload);
        });
    }

    #scheduleReconnect(token) {
        if (!this.#client || !this.#userId || !token) return;

        const delay = Math.min(
            1_000 * (2 ** this.#reconnectAttempt),
            this.#maxReconnectDelayMs,
        );
        this.#reconnectAttempt += 1;

        window.setTimeout(() => {
            if (this.#userId && token) {
                this.connect(this.#userId, token);
            }
        }, delay);
    }
}

let _singleton = null;

export function getUserNotificationsSocketClient(handlers) {
    if (!_singleton) {
        _singleton = new UserNotificationsSocketClient(handlers);
    }
    return _singleton;
}

export function resetUserNotificationsSocketClient() {
    if (_singleton) {
        _singleton.disconnect();
        _singleton = null;
    }
}
