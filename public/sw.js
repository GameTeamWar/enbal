// Service Worker for Push Notifications
const CACHE_NAME = 'enbal-sigorta-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/favicon.ico'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - Tarayıcı kapalı olsa bile çalışır
self.addEventListener('push', (event) => {
  console.log('📨 Push message received:', event);

  let notificationData = {
    title: 'Enbal Sigorta',
    body: 'Yeni bildiriminiz var',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'enbal-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ],
    data: {
      url: '/my-quotes',
      timestamp: Date.now()
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Show notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200], // Mobil titreşim
      sound: '/notification.mp3' // Ses dosyası
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open app when notification is clicked
  const url = event.notification.data?.url || '/my-quotes';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      
      // Open new window if app is not open
      return self.clients.openWindow(url);
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-notification-check') {
    event.waitUntil(checkForNotifications());
  }
});

// Check for notifications when online
async function checkForNotifications() {
  try {
    // Bu fonksiyon kullanıcı offline iken missed notification'ları kontrol eder
    console.log('📡 Checking for missed notifications...');
    
    // Burada API call yaparak missed notification'ları check edebiliriz
    // Şimdilik basit bir log
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Fetch event for offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});
