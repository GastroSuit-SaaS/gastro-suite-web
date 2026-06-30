import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { apiEnv } from '../../../shared/infrastructure/env.js';

let messagingInstance = null;

function firebaseConfig() {
    const cfg = apiEnv.firebase;
    if (!cfg.apiKey || !cfg.projectId || !cfg.messagingSenderId || !cfg.appId) {
        return null;
    }
    return {
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain || undefined,
        projectId: cfg.projectId,
        messagingSenderId: cfg.messagingSenderId,
        appId: cfg.appId,
    };
}

function getOrInitApp(config) {
    const existing = getApps();
    if (existing.length > 0) {
        return existing[0];
    }
    return initializeApp(config);
}

async function ensureServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return null;
    }
    try {
        return await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
        });
    } catch {
        return null;
    }
}

function bindForegroundHandler(messaging) {
    if (messagingInstance === messaging) {
        return;
    }
    messagingInstance = messaging;
    onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? payload.data?.title ?? 'GastroSuite';
        const body = payload.notification?.body ?? payload.data?.body ?? '';
        window.dispatchEvent(new CustomEvent('gastro:in-app-notification', {
            detail: {
                id: payload.data?.notificationId ?? null,
                title,
                body,
            },
        }));
        window.dispatchEvent(new CustomEvent('gastro:notifications-updated'));
    });
}

function warnPushDisabled(reason) {
    if (import.meta.env.DEV) {
        console.warn(`[GastroSuite FCM] Push deshabilitado: ${reason}`);
    }
}

/**
 * Obtiene token FCM web para registrar en el API.
 * Requiere VITE_FIREBASE_* (generadas con npm run sync:firebase-sw desde el JSON del API).
 */
export async function tryObtainFcmWebToken() {
    const config = firebaseConfig();
    if (!config || !apiEnv.firebase.vapidKey) {
        warnPushDisabled(
            'ejecuta npm run sync:firebase-sw (lee gastro-suite-api/secrets/firebase-service-account.json) '
            + 'y define VITE_FIREBASE_VAPID_KEY en .env.development.local',
        );
        return null;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
    }

    if (!(await isSupported())) {
        warnPushDisabled('este navegador no soporta Firebase Messaging');
        return null;
    }

    if (Notification.permission === 'denied') {
        warnPushDisabled('permiso de notificaciones denegado en el navegador');
        return null;
    }

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            warnPushDisabled('permiso de notificaciones no concedido');
            return null;
        }
    }

    const registration = await ensureServiceWorker();
    if (!registration) {
        warnPushDisabled('no se pudo registrar firebase-messaging-sw.js (¿npm run sync:firebase-sw?)');
        return null;
    }

    const app = getOrInitApp(config);
    const messaging = getMessaging(app);
    bindForegroundHandler(messaging);

    return getToken(messaging, {
        vapidKey: apiEnv.firebase.vapidKey,
        serviceWorkerRegistration: registration,
    });
}
