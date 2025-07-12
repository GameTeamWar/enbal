// public/firebase-messaging-sw.js
// Firebase Messaging Service Worker

// Firebase SDK imports
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize messaging
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // Notification options
  const notificationTitle = payload.notification?.title || 'Enbal Sigorta';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bir bildiriminiz var',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'enbal-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      click_action: payload.data?.click_action || '/my-quotes',
      url: payload.data?.url || '/my-quotes',
      quoteId: payload.data?.quoteId || '',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'Görüntüle',
        icon: '/icon-view.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/icon-close.png'
      }
    ]
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  // Handle action buttons
  if (event.action === 'close') {
    return;
  }
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/my-quotes';
  
  // Focus or open window
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        const fullUrl = self.location.origin + urlToOpen;
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// Service Worker install event
self.addEventListener('install', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker installing');
  self.skipWaiting();
});

// Service Worker activate event
self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Handle push events
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[firebase-messaging-sw.js] Push payload:', payload);
      
      // Firebase messaging will handle this automatically
      // This is just for logging
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error parsing push data:', error);
    }
  }
});