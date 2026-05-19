const CACHE_NAME = 'safeleafkitchen-v1.3.0';
const IMAGE_CACHE_NAME = 'safeleafkitchen-images-v1.3.0';
const MODEL_CACHE_NAME = 'safeleafkitchen-models-v1.3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Roboflow model weight URLs pattern - cache these for offline/PWA use
const ROBOFLOW_MODEL_PATTERNS = [
  'https://public.roboflow.com/',
  'https://api.roboflow.com/',
  'https://roboflow-server.roboflow.com/',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache addAll failed:', error);
      })
  );
});

// Fetch event - Stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (HEAD, OPTIONS, etc.) — cache.put breaks on HEAD
  if (event.request.method !== 'GET') return;
  // Skip non-http(s) URLs (chrome-extension://, data:, blob:) — cache.put rejects them
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Handle Roboflow model weights - cache-first for PWA persistence
  const isModelAsset = ROBOFLOW_MODEL_PATTERNS.some(pattern =>
    url.href.startsWith(pattern)
  ) || url.pathname.match(/\.(bin|weights|model|protobuf|json)(\?.*)?$/i);

  if (isModelAsset) {
    event.respondWith(
      caches.open(MODEL_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // Cache-first: return cached model weights immediately
          if (cachedResponse) {
            // Update in background
            fetch(event.request).then(networkResponse => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {});
            return cachedResponse;
          }
          // Not in cache - fetch and cache
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Handle image requests
  if (event.request.destination === 'image' ||
    url.pathname.startsWith('/images/') ||
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // Return cached response immediately if available, but also update it in background
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null); // Eat errors for background fetch

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for other resources
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Update cache
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and no cache, try fallback
        return caches.match('/');
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Activate event - take control and cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME && cacheName !== MODEL_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Listen for skipWaiting message from the app
self.addEventListener('message', (event) => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Handle offline actions when back online
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };

    event.waitUntil(
      self.registration.showNotification('SafeLeafKitchen', options)
    );
  }
});