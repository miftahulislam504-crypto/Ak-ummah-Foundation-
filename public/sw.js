const CACHE_NAME    = 'ekummah-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/offline',
  '/manifest.json',
];

// ===== INSTALL =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ===== FETCH =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass Firebase, analytics, and external APIs
  const bypassDomains = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebasestorage.googleapis.com',
    'aladhan.com',
    'nominatim.openstreetmap.org',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];
  if (bypassDomains.some((d) => url.hostname.includes(d))) {
    return; // Let browser handle directly
  }

  // For navigation requests — network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline'))
        )
    );
    return;
  }

  // For static assets — cache first, then network
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Default — network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body:    data.body    || 'এক উম্মাহ ফাউন্ডেশন থেকে নতুন বার্তা',
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/dashboard' },
    actions: [
      { action: 'view',    title: 'দেখুন'  },
      { action: 'dismiss', title: 'বাতিল' },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'এক উম্মাহ ফাউন্ডেশন', options)
  );
});

// ===== NOTIFICATION CLICK =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
