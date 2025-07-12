// lib/fcm-simple.ts - Basitleştirilmiş FCM Test
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const vapidKey = 'O3z6guGvKPxlDyZTAriwuwYFqCGcSOubgJ6TR2FHF1k';

export const setupFCMSimple = async (userId: string) => {
  console.log('🔄 FCM Setup başladı...');
  
  if (typeof window === 'undefined') {
    console.log('❌ Browser environment değil');
    return null;
  }

  try {
    // 1. Service Worker registration
    console.log('📝 Service Worker registering...');
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registered:', registration);
    }

    // 2. Notification permission
    console.log('🔔 Notification permission requesting...');
    const permission = await Notification.requestPermission();
    console.log('📋 Permission result:', permission);
    
    if (permission !== 'granted') {
      console.log('❌ Notification permission denied');
      return null;
    }

    // 3. Get messaging instance
    console.log('🔥 Getting Firebase messaging...');
    const messaging = getMessaging();
    console.log('✅ Messaging instance created');

    // 4. Get FCM token
    console.log('🎫 Getting FCM token...');
    console.log('🔑 Using VAPID key:', vapidKey);
    
    const token = await getToken(messaging, { vapidKey });
    
    if (token) {
      console.log('✅ FCM Token alındı:', token);
      
      // 5. Save to Firestore
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdated: new Date(),
        notificationsEnabled: true
      });
      
      console.log('💾 Token Firestore\'a kaydedildi');
      
      // 6. Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('📨 Foreground message received:', payload);
        
        if (payload.notification && Notification.permission === 'granted') {
          new Notification(payload.notification.title || 'Enbal Sigorta', {
            body: payload.notification.body,
            icon: '/favicon.ico'
          });
        }
      });
      
      return token;
    } else {
      console.log('❌ FCM token alınamadı');
      return null;
    }
    
  } catch (error) {
    console.error('💥 FCM Setup Error:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('messaging/token-subscribe-failed')) {
        console.error('🔑 VAPID key problemi olabilir');
      }
      if (error.message.includes('messaging/permission-blocked')) {
        console.error('🚫 Notifications blocked by user');
      }
    }
    
    return null;
  }
};

export const testNotificationSimple = async (userId: string) => {
  console.log('📤 Test notification gönderiliyor...');
  
  try {
    const response = await fetch('/api/web-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title: '🎉 Test Bildirimi',
        body: 'FCM sistemi çalışıyor!',
        icon: '/favicon.ico'
      }),
    });

    const result = await response.json();
    console.log('📬 Test notification result:', result);
    
    return result;
  } catch (error) {
    console.error('💥 Test notification error:', error);
    return { success: false, error: error.message };
  }
};