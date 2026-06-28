import { apiEnv } from '../../../shared/infrustructure/env.js';

/**
 * FCM web opcional. Instalar `firebase` y definir VITE_FIREBASE_* para habilitar push.
 * Sin paquete/config, retorna null (notificaciones in-app siguen operativas).
 */
export async function tryObtainFcmWebToken() {
    if (!apiEnv.firebase.apiKey || !apiEnv.firebase.vapidKey) {
        return null;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
    }

    if (Notification.permission === 'denied') {
        return null;
    }

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;
    }

    // Evita dependencia obligatoria en build; habilitar cuando se añada firebase al proyecto.
    return null;
}
