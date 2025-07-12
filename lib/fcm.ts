// lib/fcm.ts - Düzeltilmiş FCM Setup
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db, getMessagingInstance } from '@/lib/firebase';

// Güncel VAPID key - Firebase Console'dan alınacak
const vapidKey = 'BOqVG7JK8z5Q2Y0J4tH1m5YyZ3kT_XpDtNg7RzB0sKhEzQ1LzI3Z8cP5rV2sSfQmNjUv6lR8hF4tMzG9Xp1B2y0';

// Service Worker registration - geliştirilmiş versiyon
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser');
  }

  try {
    // Mevcut registration'ı kontrol et
    const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope');
    
    if (existingRegistration) {
      console.log('Service Worker already registered:', existingRegistration);
      return existingRegistration;
    }

    // Yeni registration
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });
    
    console.log('Service Worker registered successfully:', registration);
    
    // Registration'ın aktif olmasını bekle
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

// Request notification permission - geliştirilmiş
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission === 'granted') {
      return true;
    } else if (permission === 'denied') {
      console.log('User denied notification permission');
      return false;
    } else {
      console.log('User dismissed notification permission dialog');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// FCM token alma - hata düzeltmeleri ile
export const setupFCM = async (userId: string) => {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return null;
  }

  try {
    console.log('🔄 FCM setup başlıyor...');

    // 1. Service Worker'ı register et
    console.log('📝 Service Worker kaydediliyor...');
    const registration = await registerServiceWorker();
    
    // 2. Notification permission iste
    console.log('🔔 Notification permission isteniyor...');
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('❌ Notification permission denied');
      return null;
    }

    // 3. Messaging instance al
    console.log('💬 Messaging instance alınıyor...');
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('❌ Messaging not supported');
      return null;
    }

    // 4. FCM token al - retry logic ile
    console.log('🎫 FCM token alınıyor...');
    let token = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (!token && retryCount < maxRetries) {
      try {
        token = await getToken(messaging, { 
          vapidKey,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log('✅ FCM Token alındı:', token.substring(0, 20) + '...');
          break;
        }
      } catch (error: any) {
        retryCount++;
        console.warn(`FCM token alma denemesi ${retryCount}/${maxRetries} başarısız:`, error.message);
        
        if (retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`${delay}ms bekleyip tekrar denenecek...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!token) {
      throw new Error('FCM token alınamadı - maksimum deneme sayısına ulaşıldı');
    }
    
    // 5. Token'ı Firestore'a kaydet
    console.log('💾 Token Firestore\'a kaydediliyor...');
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token,
      fcmTokenUpdated: new Date(),
      notificationsEnabled: true,
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    });
    
    console.log('✅ FCM token Firestore\'a kaydedildi');
    
    // 6. Foreground mesajları dinle
    onMessage(messaging, (payload) => {
      console.log('📨 Foreground message received:', payload);
      
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
    
    console.log('🎉 FCM setup tamamlandı!');
    return token;
    
  } catch (error: any) {
    console.error('❌ FCM setup error:', error);
    
    // Specific error handling
    if (error.code) {
      switch (error.code) {
        case 'messaging/token-subscribe-failed':
          console.error('🔑 VAPID key hatası veya Firebase config hatası');
          break;
        case 'messaging/permission-blocked':
          console.error('🚫 Notifications kullanıcı tarafından engellendi');
          break;
        case 'messaging/unsupported-browser':
          console.error('🌐 Browser FCM desteklemiyor');
          break;
        case 'messaging/failed-service-worker-registration':
          console.error('⚙️ Service Worker registration başarısız');
          break;
        default:
          console.error('🔥 Firebase messaging error:', error.code);
      }
    }
    
    throw error;
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
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: '/favicon.ico',
        tag: 'enbal-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
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
      
      console.log('🔔 Custom notification gösterildi');
    } catch (error) {
      console.error('Notification display error:', error);
    }
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
    console.log('✅ FCM token kaldırıldı');
    return true;
  } catch (error) {
    console.error('❌ FCM token removal error:', error);
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
    console.log('📨 Test notification result:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Test notification error:', error);
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