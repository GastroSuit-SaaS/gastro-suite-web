import { Client } from '@stomp/stompjs';
import { SESSION_KEYS } from '../session-storage.js';
import {
    OPERATIONAL_CHANNELS,
    operationalTopic,
    parseOperationalEvent,
} from './operational-events.js';

const DEFAULT_WS_URL = 'ws://localhost:8080/ws/operational';

function resolveWsUrl() {
    const explicit = import.meta.env.VITE_WS_OPERATIONAL_URL;
    if (explicit) return explicit;

    const api = import.meta.env.VITE_PLATFORM_API_URL || 'http://localhost:8080/api/v1';
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

/**
 * Cliente STOMP compartido (una instancia por pestaña).
 */
export class OperationalSocketClient {
    #client = null;
    #branchId = null;
    #onEvent = null;
    #onConnectionChange = null;
    #reconnectAttempt = 0;
    #maxReconnectDelayMs = 30_000;
    #fallbackTimer = null;
    #connected = false;

    /**
     * @param {{ onEvent: (event: import('./operational-events.js').OperationalEventMessage) => void, onConnectionChange?: (connected: boolean) => void }} handlers
     */
    constructor({ onEvent, onConnectionChange }) {
        this.#onEvent = onEvent;
        this.#onConnectionChange = onConnectionChange ?? (() => {});
    }

    get isConnected() {
        return this.#connected;
    }

    /**
     * @param {string} branchId
     * @param {string} token
     */
    connect(branchId, token) {
        if (!branchId || !token) return;

        if (this.#branchId === branchId && this.#client?.active) {
            return;
        }

        this.disconnect();
        this.#branchId = branchId;
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
            onStompError: () => this.#scheduleReconnect(),
            onWebSocketClose: () => {
                this.#setConnected(false);
                this.#scheduleReconnect();
            },
            onDisconnect: () => this.#setConnected(false),
        });

        this.#client.activate();
    }

    disconnect() {
        this.#clearFallbackTimer();
        this.#setConnected(false);
        if (this.#client) {
            try {
                this.#client.deactivate();
            } catch { /* ok */ }
            this.#client = null;
        }
        this.#branchId = null;
    }

    /** Polling de respaldo cuando el socket no está conectado. */
    startFallbackPolling(callback, intervalMs = 45_000) {
        this.#clearFallbackTimer();
        this.#fallbackTimer = window.setInterval(() => {
            if (!this.#connected && typeof callback === 'function') {
                callback();
            }
        }, intervalMs);
    }

    stopFallbackPolling() {
        this.#clearFallbackTimer();
    }

    #handleConnect() {
        this.#reconnectAttempt = 0;
        this.#setConnected(true);
        this.#subscribeAll();
        window.dispatchEvent(new CustomEvent('gastro:operational-socket-connected', {
            detail: { branchId: this.#branchId },
        }));
    }

    #subscribeAll() {
        if (!this.#client?.connected || !this.#branchId) return;

        for (const channel of OPERATIONAL_CHANNELS) {
            const destination = operationalTopic(this.#branchId, channel);
            this.#client.subscribe(destination, (message) => {
                try {
                    const parsed = parseOperationalEvent(JSON.parse(message.body));
                    if (parsed) this.#onEvent(parsed);
                } catch { /* ignore malformed */ }
            });
        }
    }

    #scheduleReconnect() {
        this.#setConnected(false);
        if (!this.#client || !this.#branchId) return;

        const token = localStorage.getItem(SESSION_KEYS.TOKEN);
        if (!token) return;

        const delay = Math.min(
            1_000 * (2 ** this.#reconnectAttempt),
            this.#maxReconnectDelayMs,
        );
        this.#reconnectAttempt += 1;

        window.setTimeout(() => {
            if (this.#branchId && token) {
                this.connect(this.#branchId, token);
            }
        }, delay);
    }

    #setConnected(value) {
        if (this.#connected === value) return;
        this.#connected = value;
        this.#onConnectionChange(value);
    }

    #clearFallbackTimer() {
        if (this.#fallbackTimer) {
            clearInterval(this.#fallbackTimer);
            this.#fallbackTimer = null;
        }
    }
}

let _singleton = null;

/**
 * @param {{ onEvent: (event: import('./operational-events.js').OperationalEventMessage) => void, onConnectionChange?: (connected: boolean) => void }} handlers
 */
export function getOperationalSocketClient(handlers) {
    if (!_singleton) {
        _singleton = new OperationalSocketClient(handlers);
    }
    return _singleton;
}

export function resetOperationalSocketClient() {
    if (_singleton) {
        _singleton.disconnect();
        _singleton.stopFallbackPolling();
        _singleton = null;
    }
}
