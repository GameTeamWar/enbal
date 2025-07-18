// lib/simple-notifications.ts - Çoklu Bildirim Engelleyici Sistem

import { doc, updateDoc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export class SimpleBrowserNotifications {
  private static instance: SimpleBrowserNotifications;
  private userId: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastNotificationTime: number = 0;
  private shownNotificationIds: Set<string> = new Set();
  private isInitialLoad: boolean = true;
  // ✅ YENİ: Service Worker ve Push Subscription
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;

  static getInstance(): SimpleBrowserNotifications {
    if (!SimpleBrowserNotifications.instance) {
      SimpleBrowserNotifications.instance = new SimpleBrowserNotifications();
    }
    return SimpleBrowserNotifications.instance;
  }

  // ✅ Service Worker kayıt fonksiyonu
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('❌ Service Worker desteklenmiyor');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker kaydedildi:', registration.scope);
      
      // Service Worker'ın aktif olmasını bekle
      await navigator.serviceWorker.ready;
      
      this.serviceWorkerRegistration = registration;
      return registration;
    } catch (error) {
      console.error('❌ Service Worker kayıt hatası:', error);
      return null;
    }
  }

  // ✅ Push Subscription oluştur
  private async createPushSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.log('❌ Service Worker bulunamadı');
      return null;
    }

    try {
      // VAPID public key (production'da environment variable olarak kullanın)
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa40HI80NMtg3-k6RJOjDZksP-0k0BoHKn8ZGNxSHqXp4AKZeM6R7lbOOyQO0E';
      
      const pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey)
      });

      console.log('✅ Push Subscription oluşturuldu');
      this.pushSubscription = pushSubscription;
      
      // Subscription'ı sunucuya kaydet
      await this.savePushSubscription(pushSubscription);
      
      return pushSubscription;
    } catch (error) {
      console.error('❌ Push Subscription hatası:', error);
      return null;
    }
  }

  // ✅ VAPID key conversion utility
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ✅ Push Subscription'ı sunucuya kaydet
  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    if (!this.userId) return;

    try {
      const response = await fetch('/api/save-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          subscription: subscription.toJSON()
        }),
      });

      if (!response.ok) {
        throw new Error('Push subscription kayıt hatası');
      }

      console.log('✅ Push subscription sunucuya kaydedildi');
    } catch (error) {
      console.error('❌ Push subscription kayıt hatası:', error);
    }
  }

  // Browser notification izni alma - GÜNCELLEME
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('❌ Browser notification desteklemiyor');
      return false;
    }

    try {
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      console.log('📋 Notification permission:', permission);
      
      if (permission === 'granted') {
        // ✅ İzin alındıysa Service Worker'ı kaydet
        await this.registerServiceWorker();
        
        // ✅ Push Subscription oluştur
        await this.createPushSubscription();
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  // Kullanıcı için notification sistemi kurma - GÜNCELLEME
  async setupForUser(userId: string): Promise<boolean> {
    this.userId = userId;
    
    try {
      // 1. Permission al ve Service Worker kaydet
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // 2. Önce mevcut bildirimleri temizle
      this.resetNotificationTracking();

      // 3. Real-time dinleme başlat
      this.startSimpleListener(userId);

      // 4. Kullanıcı bilgilerini güncelle
      await updateDoc(doc(db, 'users', userId), {
        browserNotificationsEnabled: true,
        pushNotificationsEnabled: !!this.pushSubscription,
        notificationSetupDate: new Date(),
        lastNotificationCheck: new Date()
      });

      // 5. Setup notification göster (sadece ilk kurulumda)
      setTimeout(() => {
        this.showNotification({
          title: '🎉 Bildirimler Aktif!',
          body: 'Artık tarayıcı kapalı olsa bile bildirim alabileceksiniz!',
          icon: '/favicon.ico',
          tag: 'setup-notification'
        });
      }, 1000);

      console.log('✅ Enhanced notification system aktif edildi');
      return true;
    } catch (error) {
      console.error('Notification setup error:', error);
      throw error;
    }
  }

  // Notification tracking'i sıfırla
  private resetNotificationTracking() {
    this.shownNotificationIds.clear();
    this.lastNotificationTime = Date.now(); // Şu anki zamandan başla
    this.isInitialLoad = true;
    console.log('🔄 Notification tracking sıfırlandı');
  }

  // ✅ Düzeltilmiş Real-time Firestore dinleyici - Çoklu bildirim engelleyici
  private startSimpleListener(userId: string) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // SADECE kullanıcı ID'si ile filtreleme - index gerektirmez
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10) // Sadece son 10 bildirimi takip et
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📨 Notification snapshot alındı:', {
        size: snapshot.size,
        isInitialLoad: this.isInitialLoad,
        lastNotificationTime: new Date(this.lastNotificationTime).toLocaleTimeString()
      });

      // İlk yükleme ise (sayfa yenilenme vb.) sadece tracking'i başlat, bildirim gösterme
      if (this.isInitialLoad) {
        snapshot.docs.forEach(doc => {
          const notification = doc.data();
          const notificationTime = notification.createdAt?.toMillis() || 0;
          
          // Mevcut bildirimleri tracking'e ekle
          this.shownNotificationIds.add(doc.id);
          
          // En son bildirim zamanını güncelle
          if (notificationTime > this.lastNotificationTime) {
            this.lastNotificationTime = notificationTime;
          }
        });
        
        this.isInitialLoad = false;
        console.log('🔧 İlk yükleme tamamlandı, tracking başlatıldı');
        return;
      }

      // ✅ Sadece GERÇEK yeni bildirimleri işle
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          const notificationId = change.doc.id;
          const notificationTime = notification.createdAt?.toMillis() || Date.now();
          
          // ✅ ÇOKLU BİLDİRİM ENGELLEYİCİ KONTROLLER:
          
          // 1. Bu bildirim daha önce gösterildi mi?
          if (this.shownNotificationIds.has(notificationId)) {
            console.log('⚠️ Bu bildirim zaten gösterildi:', notificationId);
            return;
          }
          
          // 2. Bu bildirim son bildirim zamanından sonra mı oluşturuldu?
          if (notificationTime <= this.lastNotificationTime) {
            console.log('⚠️ Bu bildirim eski:', {
              notificationTime: new Date(notificationTime).toLocaleTimeString(),
              lastTime: new Date(this.lastNotificationTime).toLocaleTimeString()
            });
            // Yine de tracking'e ekle
            this.shownNotificationIds.add(notificationId);
            return;
          }
          
          // 3. Bildirim çok eski mi? (5 dakikadan eski bildirimleri gösterme)
          const now = Date.now();
          const isOld = (now - notificationTime) > (5 * 60 * 1000); // 5 dakika
          if (isOld) {
            console.log('⚠️ Bu bildirim çok eski:', {
              notificationTime: new Date(notificationTime).toLocaleTimeString(),
              ageMinutes: Math.round((now - notificationTime) / 60000)
            });
            this.shownNotificationIds.add(notificationId);
            return;
          }
          
          // 4. Bu bildirim okunmuş mu?
          if (notification.read) {
            console.log('⚠️ Bu bildirim zaten okunmuş:', notificationId);
            this.shownNotificationIds.add(notificationId);
            return;
          }
          
          // 5. Bildirim triggered işareti var mı? (server tarafından tetiklenen)
          if (!notification.triggered) {
            console.log('⚠️ Bu bildirim triggered değil:', notificationId);
            this.shownNotificationIds.add(notificationId);
            return;
          }

          // ✅ TÜM KONTROLLER BAŞARILI - BİLDİRİMİ GÖSTER
          console.log('🎯 YENİ BİLDİRİM GÖSTER:', {
            id: notificationId,
            title: notification.title,
            time: new Date(notificationTime).toLocaleTimeString(),
            type: notification.type
          });

          this.showNotification({
            title: notification.title || 'Enbal Sigorta',
            body: notification.message || 'Yeni bildiriminiz var',
            icon: '/favicon.ico',
            tag: `notification-${notificationId}`, // Her bildirim için unique tag
            data: {
              notificationId: notificationId,
              url: '/my-quotes',
              type: notification.type
            }
          });
          
          // ✅ Tracking'i güncelle
          this.shownNotificationIds.add(notificationId);
          this.lastNotificationTime = Math.max(this.lastNotificationTime, notificationTime);
          
          console.log('✅ Bildirim tracking güncellendi:', {
            totalShown: this.shownNotificationIds.size,
            lastTime: new Date(this.lastNotificationTime).toLocaleTimeString()
          });
        }
      });
    }, (error) => {
      console.error('❌ Notification listener error:', error);
      // Hata durumunda 15 saniye sonra tekrar dene
      setTimeout(() => {
        if (this.userId) {
          console.log('🔄 Notification listener yeniden başlatılıyor...');
          this.resetNotificationTracking(); // Tracking'i sıfırla
          this.startSimpleListener(this.userId);
        }
      }, 15000);
    });

    console.log('🎧 Simple notification listener başlatıldı');
  }

  // Browser notification göster - GÜNCELLEME
  showNotification(data: NotificationData) {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      console.log('❌ Notifications not available or permission not granted');
      return;
    }
    
    try {
      // ✅ Service Worker varsa onu kullan (tarayıcı kapalı olsa bile çalışır)
      if (this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: data.tag || `enbal-notification-${Date.now()}`,
          requireInteraction: true,
          silent: false,
          actions: [
            {
              action: 'open',
              title: 'Aç'
            },
            {
              action: 'close', 
              title: 'Kapat'
            }
          ],
          data: data.data || { url: '/my-quotes' }
        } as any);
        
        console.log('📨 Service Worker notification gösterildi:', data.title);
        this.playAdvancedNotificationSound();
        return;
      }

      // ✅ Fallback: Normal browser notification
      // Aynı tag'li notification varsa önce kapat
      if (data.tag) {
        const existingNotifications = (window as any).currentNotifications || new Map();
        if (existingNotifications.has(data.tag)) {
          const oldNotification = existingNotifications.get(data.tag);
          oldNotification.close();
          existingNotifications.delete(data.tag);
        }
      }

      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: data.tag || `enbal-notification-${Date.now()}`,
        requireInteraction: true,
        silent: false
      });

      // ✅ Notification'ı takip et
      if (!((window as any).currentNotifications)) {
        (window as any).currentNotifications = new Map();
      }
      if (data.tag) {
        (window as any).currentNotifications.set(data.tag, notification);
      }

      // Notification click event
      notification.onclick = () => {
        window.focus();
        
        // Notification verilerini kontrol et
        if (data.data?.url) {
          window.location.href = data.data.url;
        } else {
          window.location.href = '/my-quotes';
        }
        
        // Notification'ı kapat ve tracking'den çıkar
        notification.close();
        if (data.tag && (window as any).currentNotifications) {
          (window as any).currentNotifications.delete(data.tag);
        }
        
        // Eğer notificationId varsa, okundu olarak işaretle
        if (data.data?.notificationId) {
          this.markAsRead(data.data.notificationId);
        }
      };

      // 20 saniye sonra otomatik kapat
      setTimeout(() => {
        notification.close();
        if (data.tag && (window as any).currentNotifications) {
          (window as any).currentNotifications.delete(data.tag);
        }
      }, 20000);

      console.log('📨 Notification gösterildi:', data.title);
      
      // Basit sistem sesi çal
      this.playAdvancedNotificationSound();
      
    } catch (error) {
      console.error('Notification display error:', error);
    }
  }

  // ✅ Gelişmiş notification sesi - Mobil ve masaüstü uyumlu
  private playAdvancedNotificationSound() {
    try {
      // Mobil cihazlarda vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      // Ses çalma
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Çift tonlu notification sesi - mobil uyumlu
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // İlk ton - daha yumuşak
        oscillator1.frequency.value = 880;
        oscillator1.type = 'sine';
        
        // İkinci ton - harmonik
        oscillator2.frequency.value = 1100;
        oscillator2.type = 'sine';
        
        // Ses seviyesi - mobilde daha düşük
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const volume = isMobile ? 0.05 : 0.1;
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        // Sesi başlat ve durdur
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.2);
        
        oscillator2.start(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.35);
        
        console.log('🔊 Enhanced notification sesi çalındı');
      }
    } catch (error: any) {
      console.log('Ses çalma hatası (normal):', error.message);
    }
  }

  // Bildirimi okundu olarak işaretle
  private async markAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date(),
        shownInBrowser: true // Browser'da gösterildi işareti
      });
      console.log('📖 Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  // Test notification - GÜNCELLEME
  showTestNotification() {
    const testId = `test-${Date.now()}`;
    this.showNotification({
      title: '🎉 Test Bildirimi',
      body: 'Enhanced notification sistemi mükemmel çalışıyor! Tarayıcı kapalı olsa bile alabilirsiniz 🚀',
      icon: '/favicon.ico',
      tag: testId,
      data: {
        url: '/my-quotes',
        type: 'test'
      }
    });
  }

  // Sistem durumunu kontrol et - GÜNCELLEME
  getStatus(): { 
    permission: NotificationPermission | 'unsupported';
    isSetup: boolean;
    isListening: boolean;
    shownCount: number;
    hasServiceWorker: boolean;
    hasPushSubscription: boolean;
  } {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        permission: 'unsupported',
        isSetup: false,
        isListening: false,
        shownCount: 0,
        hasServiceWorker: false,
        hasPushSubscription: false
      };
    }

    return {
      permission: Notification.permission,
      isSetup: !!this.userId,
      isListening: !!this.unsubscribe,
      shownCount: this.shownNotificationIds.size,
      hasServiceWorker: !!this.serviceWorkerRegistration,
      hasPushSubscription: !!this.pushSubscription
    };
  }

  // ✅ Debug bilgileri
  getDebugInfo() {
    return {
      userId: this.userId,
      isListening: !!this.unsubscribe,
      shownNotificationIds: Array.from(this.shownNotificationIds),
      shownCount: this.shownNotificationIds.size,
      lastNotificationTime: new Date(this.lastNotificationTime).toLocaleString(),
      isInitialLoad: this.isInitialLoad
    };
  }

  // Notification sistemini kapat
  async disable(userId: string) {
    try {
      // Listener'ı durdur
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      // Database'i güncelle
      await updateDoc(doc(db, 'users', userId), {
        browserNotificationsEnabled: false,
        notificationDisabledDate: new Date()
      });

      // ✅ Tracking'i temizle
      this.resetNotificationTracking();
      this.userId = null;

      // ✅ Açık notification'ları kapat
      if ((window as any).currentNotifications) {
        (window as any).currentNotifications.forEach((notification: Notification) => {
          notification.close();
        });
        (window as any).currentNotifications.clear();
      }

      console.log('❌ Notification system disabled');
    } catch (error) {
      console.error('Notification disable error:', error);
      throw error;
    }
  }
}

// Kolay kullanım için wrapper fonksiyonlar
export const setupSimpleNotifications = async (userId: string): Promise<boolean> => {
  try {
    const manager = SimpleBrowserNotifications.getInstance();
    return await manager.setupForUser(userId);
  } catch (error) {
    console.error('Setup simple notifications error:', error);
    return false;
  }
};

export const showTestNotification = () => {
  try {
    const manager = SimpleBrowserNotifications.getInstance();
    manager.showTestNotification();
  } catch (error) {
    console.error('Show test notification error:', error);
  }
};

export const disableNotifications = async (userId: string) => {
  try {
    const manager = SimpleBrowserNotifications.getInstance();
    await manager.disable(userId);
  } catch (error) {
    console.error('Disable notifications error:', error);
    throw error;
  }
};

export const getNotificationStatus = () => {
  const manager = SimpleBrowserNotifications.getInstance();
  return manager.getStatus();
};

// ✅ Debug helper
export const getNotificationDebugInfo = () => {
  const manager = SimpleBrowserNotifications.getInstance();
  return manager.getDebugInfo();
};

// Server-side notification trigger için API endpoint
export const triggerServerNotification = async (userId: string, notificationData: {
  title: string;
  body: string;
  type: string;
  quoteId?: string;
  insuranceType?: string;
}) => {
  try {
    const response = await fetch('/api/trigger-browser-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...notificationData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('❌ Server notification trigger error:', error);
    return { success: false, error: error.message };
  }
};