// public/firebase-messaging-sw.js
// Düzeltilmiş Firebase Service Worker

// Firebase SDK import (v9 compat)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBv89xYNDaxaJO7cDmBVPgsXxQRDXp6Dus",
  authDomain: "enbal-c028e.firebaseapp.com",
  projectId: "enbal-c028e",
  storageBucket: "enbal-c028e.firebasestorage.app",
  messagingSenderId: "565874833407",
  appId: "1:565874833407:web:e1e81ff346185a2d8e19ca",
  measurementId: "G-M4EMGQWC8Z"
};

// Firebase initialize
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Messaging service
const messaging = firebase.messaging();

// Service Worker scope
self.addEventListener('install', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Background message handler
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // Notification options
  const notificationTitle = payload.notification?.title || 'Enbal Sigorta';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bir bildiriminiz var',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    image: payload.notification?.image,
    tag: payload.data?.quoteId ? `quote-${payload.data.quoteId}` : 'enbal-notification',
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Görüntüle',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/favicon.ico'
      }
    ],
    data: {
      url: payload.data?.url || '/my-quotes',
      quoteId: payload.data?.quoteId,
      insuranceType: payload.data?.insuranceType,
      timestamp: payload.data?.timestamp || Date.now(),
      click_action: payload.data?.click_action || 'FLUTTER_NOTIFICATION_CLICK'
    }
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open the app
    const urlToOpen = event.notification.data?.url || '/my-quotes';
    const baseUrl = self.location.origin;
    const fullUrl = new URL(urlToOpen, baseUrl).href;
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.startsWith(baseUrl) && 'focus' in client) {
            return client.focus().then(() => {
              return client.navigate(fullUrl);
            });
          }
        }
        
        // If app is not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      }).catch(function(error) {
        console.error('[firebase-messaging-sw.js] Error handling notification click:', error);
      })
    );
  } else if (event.action === 'close') {
    // Just close the notification (already closed above)
    console.log('[firebase-messaging-sw.js] Notification closed by user');
  }
});

// Push event handler (fallback)
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (!event.data) {
    console.log('[firebase-messaging-sw.js] Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('[firebase-messaging-sw.js] Push payload:', payload);
    
    // Firebase Messaging usually handles this automatically
    // This is a fallback in case the automatic handling fails
    if (payload.notification && !payload.from) {
      const notificationTitle = payload.notification.title || 'Enbal Sigorta';
      const notificationOptions = {
        body: payload.notification.body || 'Yeni bildirim',
        icon: payload.notification.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: payload.data?.quoteId ? `quote-${payload.data.quoteId}` : 'enbal-notification',
        requireInteraction: true,
        data: payload.data || {}
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    }
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error parsing push data:', error);
    
    // Show generic notification as fallback
    event.waitUntil(
      self.registration.showNotification('Enbal Sigorta', {
        body: 'Yeni bir bildiriminiz var',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'enbal-notification',
        requireInteraction: true,
        data: { url: '/my-quotes' }
      })
    );
  }
});

// Sync event for offline support
self.addEventListener('sync', function(event) {
  console.log('[firebase-messaging-sw.js] Background sync:', event.tag);
  
  if (event.tag === 'fcm-token-refresh') {
    event.waitUntil(
      // Token refresh logic
      fetch('/api/refresh-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(function(error) {
        console.error('[firebase-messaging-sw.js] Token refresh failed:', error);
      })
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', function(event) {
  console.log('[firebase-messaging-sw.js] Message received:', event.data);
  
  if (event.data && event.data.type === 'GET_REGISTRATION') {
    event.ports[0].postMessage({
      type: 'REGISTRATION_RESPONSE',
      registration: self.registration
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handler
self.addEventListener('error', function(event) {
  console.error('[firebase-messaging-sw.js] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('[firebase-messaging-sw.js] Unhandled promise rejection:', event.reason);
});