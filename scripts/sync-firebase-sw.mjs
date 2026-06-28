/**
 * Sincroniza FCM web desde el JSON de cuenta de servicio del API (mismo proyecto Firebase).
 * Genera .env.development.local (VITE_FIREBASE_*) y public/firebase-messaging-sw.js
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultCredentialsPath = resolve(root, '../gastro-suite-api/secrets/firebase-service-account.json');

function loadEnvFile(name) {
    const path = resolve(root, name);
    if (!existsSync(path)) return {};
    const vars = {};
    for (const line of readFileSync(path, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        vars[key] = value;
    }
    return vars;
}

function writeEnvFile(name, vars) {
    const lines = [
        '# Auto-generado por scripts/sync-firebase-sw.mjs — no editar VITE_FIREBASE_* a mano',
        '# VAPID: Firebase Console → Project settings → Cloud Messaging → Web Push certificates',
        '',
    ];
    for (const [key, value] of Object.entries(vars)) {
        if (value) lines.push(`${key}=${value}`);
    }
    writeFileSync(resolve(root, name), `${lines.join('\n')}\n`, 'utf8');
}

async function getAccessToken(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claim = Buffer.from(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    })).toString('base64url');
    const signInput = `${header}.${claim}`;
    const sign = createSign('RSA-SHA256').update(signInput).sign(serviceAccount.private_key, 'base64url');
    const jwt = `${signInput}.${sign}`;

    const body = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    const data = await response.json();
    if (!data.access_token) {
        throw new Error(`OAuth token failed: ${JSON.stringify(data)}`);
    }
    return data.access_token;
}

async function fetchWebAppConfig(serviceAccount) {
    const token = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    const appsResponse = await fetch(
        `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
        { headers: { Authorization: `Bearer ${token}` } },
    );
    const appsData = await appsResponse.json();
    const app = appsData.apps?.find((item) => item.state === 'ACTIVE') ?? appsData.apps?.[0];
    if (!app?.appId) {
        throw new Error(`No web app found in Firebase project ${projectId}`);
    }

    const configResponse = await fetch(
        `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${app.appId}/config`,
        { headers: { Authorization: `Bearer ${token}` } },
    );
    const config = await configResponse.json();
    if (!config.apiKey) {
        throw new Error(`Web app config missing apiKey for ${app.appId}`);
    }

    return {
        apiKey: config.apiKey,
        authDomain: config.authDomain ?? `${projectId}.firebaseapp.com`,
        projectId: config.projectId ?? projectId,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId ?? app.appId,
        displayName: app.displayName,
    };
}

function resolveCredentialsPath(env) {
    const fromEnv = env.FIREBASE_CREDENTIALS_PATH ?? process.env.FIREBASE_CREDENTIALS_PATH;
    if (fromEnv && existsSync(fromEnv)) return resolve(fromEnv);
    if (fromEnv && existsSync(resolve(root, fromEnv))) return resolve(root, fromEnv);
    if (existsSync(defaultCredentialsPath)) return defaultCredentialsPath;
    return null;
}

function buildSwContent(config) {
    return `/* Auto-generado por scripts/sync-firebase-sw.mjs — no editar a mano */
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
    }, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? 'GastroSuite';
  const body = payload.notification?.body ?? payload.data?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    data: payload.data ?? {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
`;
}

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = {
    ...loadEnvFile('.env'),
    ...loadEnvFile('.env.local'),
    ...loadEnvFile(`.env.${mode}`),
    ...loadEnvFile(`.env.${mode}.local`),
    ...process.env,
};

let config = {
    apiKey: env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: env.VITE_FIREBASE_APP_ID ?? '',
};
let vapidKey = env.VITE_FIREBASE_VAPID_KEY ?? '';

if (!config.apiKey || !config.projectId) {
    const credentialsPath = resolveCredentialsPath(env);
    if (!credentialsPath) {
        console.error('[firebase-sw] No VITE_FIREBASE_* ni JSON en gastro-suite-api/secrets/firebase-service-account.json');
        process.exit(1);
    }

    const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
    const webConfig = await fetchWebAppConfig(serviceAccount);
    config = webConfig;

    const localEnv = loadEnvFile('.env.development.local');
    vapidKey = vapidKey || localEnv.VITE_FIREBASE_VAPID_KEY || '';

    writeEnvFile('.env.development.local', {
        VITE_FIREBASE_API_KEY: config.apiKey,
        VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
        VITE_FIREBASE_PROJECT_ID: config.projectId,
        VITE_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
        VITE_FIREBASE_APP_ID: config.appId,
        ...(vapidKey ? { VITE_FIREBASE_VAPID_KEY: vapidKey } : {}),
    });

    console.log(`[firebase-sw] Config web desde ${credentialsPath} (${webConfig.displayName ?? webConfig.appId})`);
    if (!vapidKey) {
        console.warn('[firebase-sw] Falta VITE_FIREBASE_VAPID_KEY — añádela en .env.development.local (Firebase Console → Cloud Messaging)');
    }
}

const outPath = resolve(root, 'public', 'firebase-messaging-sw.js');
writeFileSync(outPath, buildSwContent(config), 'utf8');
console.log('[firebase-sw] public/firebase-messaging-sw.js actualizado');
