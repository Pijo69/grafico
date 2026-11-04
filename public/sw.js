/* Service worker: caché de la app + avisos push de Firebase Cloud Messaging. */
const CACHE = 'guachis-v7';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/app.js', 'js/config.js', 'js/dates.js', 'js/i18n.js', 'js/icons.js', 'js/logo.js',
  'js/recurrence.js', 'js/seed-gabri.js', 'js/store-local.js', 'js/store-firebase.js',
  'js/summary.js', 'js/firebase-config.js', 'icons/icon.svg', 'icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Red primero para los archivos propios (siempre la última versión), caché si no hay conexión.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});

// Firebase Cloud Messaging (solo si está configurado)
try {
  importScripts('js/firebase-config.js');
  if (self.FIREBASE_CONFIG && self.FIREBASE_CONFIG.apiKey) {
    importScripts(
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js'
    );
    firebase.initializeApp(self.FIREBASE_CONFIG);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      // Si el mensaje trae "notification", el navegador ya lo muestra solo.
      if (payload.notification) return;
      const d = payload.data || {};
      self.registration.showNotification(d.title || 'Guachis Home', {
        body: d.body || '',
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag: d.tag,
        data: { url: d.url || './' },
      });
    });
  }
} catch (err) {
  console.warn('FCM no disponible en el SW', err);
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow(url);
    })
  );
});
