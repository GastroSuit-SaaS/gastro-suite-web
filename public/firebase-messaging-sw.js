/* Auto-generado por scripts/sync-firebase-sw.mjs — no editar a mano */
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

firebase.initializeApp({
  "apiKey": "AIzaSyAh2nXjZIW5dWci5GH-ibsR7ysRxGas_Dg",
  "authDomain": "upc-pre-iot-metasoft.firebaseapp.com",
  "projectId": "upc-pre-iot-metasoft",
  "messagingSenderId": "565630535895",
  "appId": "1:565630535895:web:3cfbc0720c5e0dc2438892"
});

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
