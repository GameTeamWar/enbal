// lib/fcm.ts - Gerçek VAPID Key ile FCM Setup
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db, getMessagingInstance } from '@/lib/firebase';

// Güncel VAPID key
const vapidKey = 'O3z6guGvKPxlDyZTAriwuwYFqCGcSOubgJ6TR2FHF1k';

// Service Worker registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });
      
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Worker is not supported');
  }
};

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  }
  return false;
};

// FCM token alma ve kaydetme
export const setupFCM = async (userId: string) => {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return null;
  }

  try {
    // 1. Service Worker'ı register et
    await registerServiceWorker();
    
    // 2. Notification permission iste
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return null;
    }

    // 3. Messaging instance al
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('Messaging not supported');
      return null;
    }

    // 4. FCM token al
    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope')
    });
    
    if (token) {
      console.log('FCM Token received:', token);
      
      // 5. Token'ı Firestore'a kaydet
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdated: new Date(),
        notificationsEnabled: true
      });
      
      console.log('FCM token saved to Firestore');
      
      // 6. Foreground mesajları dinle
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Custom notification göster
        if (payload.notification) {
          showCustomNotification({
            title: payload.notification.title || 'Enbal Sigorta',
            body: payload.notification.body || 'Yeni bildirim',
            icon: payload.notification.icon || '/favicon.ico',
            data: payload.data
          });
        }
      });
      
      return token;
    } else {
      console.log('No FCM token received');
      return null;
    }
    
  } catch (error) {
    console.error('FCM setup error:', error);
    
    // Specific error handling
    if (error instanceof Error) {
      if (error.message.includes('messaging/token-subscribe-failed')) {
        console.error('FCM subscription failed - check VAPID key and Firebase config');
      } else if (error.message.includes('messaging/permission-blocked')) {
        console.error('Notifications are blocked by user');
      } else if (error.message.includes('messaging/unsupported-browser')) {
        console.error('Browser does not support FCM');
      }
    }
    
    return null;
  }
};

// Custom notification gösterme
const showCustomNotification = (options: {
  title: string;
  body: string;
  icon: string;
  data?: any;
}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      badge: '/favicon.ico',
      tag: 'enbal-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Görüntüle'
        }
      ]
    });

    notification.onclick = () => {
      window.focus();
      if (options.data?.url) {
        window.location.href = options.data.url;
      } else {
        window.location.href = '/my-quotes';
      }
      notification.close();
    };

    // 10 saniye sonra otomatik kapat
    setTimeout(() => {
      notification.close();
    }, 10000);
  }
};

// FCM token'ı güncelle (periyodik)
export const refreshFCMToken = async (userId: string) => {
  if (typeof window === 'undefined') return;

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;
    
    const newToken = await getToken(messaging, { vapidKey });
    
    if (newToken) {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: newToken,
        fcmTokenUpdated: new Date()
      });
      console.log('FCM token refreshed');
      return newToken;
    }
  } catch (error) {
    console.error('FCM token refresh error:', error);
  }
};

// FCM token'ı kaldır
export const removeFCMToken = async (userId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: null,
      fcmTokenUpdated: new Date(),
      notificationsEnabled: false
    });
    console.log('FCM token removed');
    return true;
  } catch (error) {
    console.error('FCM token removal error:', error);
    return false;
  }
};

// Test notification gönder
export const sendTestNotification = async (userId: string) => {
  try {
    const response = await fetch('/api/web-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title: '🎉 Test Bildirimi',
        body: 'Push notification sistemi çalışıyor!',
        icon: '/favicon.ico',
        quoteId: 'test',
        insuranceType: 'Test'
      }),
    });

    const result = await response.json();
    console.log('Test notification result:', result);
    return result;
  } catch (error) {
    console.error('Test notification error:', error);
    return { success: false, error: error.message };
  }
};

// Browser support kontrolü
export const checkFCMSupport = async () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const messaging = await getMessagingInstance();
    return !!messaging;
  } catch (error) {
    console.error('FCM support check failed:', error);
    return false;
  }
};