// lib/simple-notifications.ts - Çoklu Bildirim Engelleyici Sistem

import { doc, updateDoc, onSnapshot, collection, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
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
    if (!this.userId) {
      console.warn('⚠️ userId bulunamadı, push subscription kayıt edilemiyor');
      return;
    }

    try {
      console.log('💾 Push subscription kaydediliyor...', {
        userId: this.userId,
        endpoint: subscription.endpoint.substring(0, 50) + '...'
      });
      
      const requestBody = {
        userId: this.userId,
        subscription: subscription.toJSON()
      };
      
      console.log('📤 API request gönderiliyor:', {
        url: '/api/save-push-subscription',
        userId: requestBody.userId,
        hasSubscription: !!requestBody.subscription
      });
      
      const response = await fetch('/api/save-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 API response alındı:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      let result;
      try {
        result = await response.json();
        console.log('📄 API response body:', result);
      } catch (parseError) {
        console.error('❌ Response parse hatası:', parseError);
        const responseText = await response.text();
        console.error('❌ Raw response:', responseText);
        throw new Error('API response parse edilemedi: ' + responseText);
      }
      
      if (!response.ok) {
        console.error('❌ Push subscription API hatası:', {
          status: response.status,
          statusText: response.statusText,
          result: result
        });
        throw new Error(result?.message || `API Error: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Push subscription sunucuya kaydedildi:', result);
    } catch (error: any) {
      console.error('❌ Push subscription kayıt hatası:', {
        error: error.message,
        userId: this.userId,
        stack: error.stack
      });
      // Push subscription hatası olsa bile sistem çalışmaya devam etsin
      console.log('⚠️ Push notification devre dışı, sadece browser notification aktif');
      
      // Re-throw sadece kritik hatalarda
      if (error.message.includes('404') || error.message.includes('Kullanıcı bulunamadı')) {
        throw error;
      }
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
        
        // ✅ Push Subscription oluştur (hata olsa bile devam et)
        try {
          await this.createPushSubscription();
        } catch (pushError) {
          console.warn('⚠️ Push Subscription oluşturulamadı:', pushError);
          // Push subscription başarısız olsa bile browser notification çalışır
        }
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
      // 1. Permission al
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // 2. Önce mevcut bildirimleri temizle
      this.resetNotificationTracking();

      // 3. Real-time dinleme başlat
      this.startSimpleListener(userId);

      // 4. Kullanıcı bilgilerini güncelle - push subscription durumuna göre
      const updateData: any = {
        browserNotificationsEnabled: true,
        notificationSetupDate: new Date(),
        lastNotificationCheck: new Date()
      };

      // Push subscription varsa onu da ekle
      if (this.pushSubscription) {
        updateData.pushNotificationsEnabled = true;
      }

      await updateDoc(doc(db, 'users', userId), updateData);

      // 5. Setup notification göster (sadece ilk kurulumda)
      setTimeout(() => {
        let message = 'Teklif güncellemeleriniz hakkında bilgilendirileceksiniz.';
        if (this.pushSubscription) {
          message = 'Artık tarayıcı kapalı olsa bile bildirim alabileceksiniz!';
        }
        
        this.showNotification({
          title: '🎉 Bildirimler Aktif!',
          body: message,
          icon: '/favicon.ico',
          tag: 'setup-notification'
        });
      }, 1000);

      console.log('✅ Enhanced notification system aktif edildi', {
        hasPushSubscription: !!this.pushSubscription,
        hasServiceWorker: !!this.serviceWorkerRegistration
      });
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

  // ✅ Real-time Firestore dinleyici - DEBUG eklendi
  private startSimpleListener(userId: string) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📨 Notification snapshot alındı:', {
        size: snapshot.size,
        isInitialLoad: this.isInitialLoad,
        lastNotificationTime: new Date(this.lastNotificationTime).toLocaleTimeString()
      });

      if (this.isInitialLoad) {
        snapshot.docs.forEach(doc => {
          const notification = doc.data();
          const notificationTime = notification.createdAt?.toMillis() || 0;
          
          this.shownNotificationIds.add(doc.id);
          
          if (notificationTime > this.lastNotificationTime) {
            this.lastNotificationTime = notificationTime;
          }
        });
        
        this.isInitialLoad = false;
        console.log('🔧 İlk yükleme tamamlandı, tracking başlatıldı');
        return;
      }

      // ✅ GERÇEK yeni bildirimleri işle
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          const notificationId = change.doc.id;
          const notificationTime = notification.createdAt?.toMillis() || Date.now();
          
          console.log('🔍 YENİ BİLDİRİM KONTROL:', {
            id: notificationId,
            title: notification.title,
            triggered: notification.triggered,
            read: notification.read,
            shownBefore: this.shownNotificationIds.has(notificationId),
            timeCheck: notificationTime > this.lastNotificationTime,
            ageMinutes: Math.round((Date.now() - notificationTime) / 60000)
          });
          
          // KONTROLLER
          if (this.shownNotificationIds.has(notificationId)) {
            console.log('⚠️ Bu bildirim zaten gösterildi:', notificationId);
            return;
          }
          
          if (notificationTime <= this.lastNotificationTime) {
            console.log('⚠️ Bu bildirim eski:', {
              notificationTime: new Date(notificationTime).toLocaleTimeString(),
              lastTime: new Date(this.lastNotificationTime).toLocaleTimeString()
            });
            this.shownNotificationIds.add(notificationId);
            return;
          }
          
          const now = Date.now();
          const isOld = (now - notificationTime) > (5 * 60 * 1000);
          if (isOld) {
            console.log('⚠️ Bu bildirim çok eski:', {
              notificationTime: new Date(notificationTime).toLocaleTimeString(),
              ageMinutes: Math.round((now - notificationTime) / 60000)
            });
            this.shownNotificationIds.add(notificationId);
            return;
          }
          
          if (notification.read) {
            console.log('⚠️ Bu bildirim zaten okunmuş:', notificationId);
            this.shownNotificationIds.add(notificationId);
            return;
          }
          
          if (!notification.triggered) {
            console.log('⚠️ Bu bildirim triggered değil:', notificationId);
            this.shownNotificationIds.add(notificationId);
            return;
          }

          // ✅ TÜM KONTROLLER BAŞARILI - BİLDİRİMİ GÖSTER
          console.log('🎯 BİLDİRİM GÖSTERİLECEK:', {
            id: notificationId,
            title: notification.title,
            message: notification.message,
            time: new Date(notificationTime).toLocaleTimeString(),
            type: notification.type
          });

          // ✅ MASAÜSTÜ BİLDİRİMİ GÖSTER
          this.showNotification({
            title: notification.title || 'Enbal Sigorta',
            body: notification.message || 'Yeni bildiriminiz var',
            icon: '/favicon.ico',
            tag: `notification-${notificationId}`,
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
      setTimeout(() => {
        if (this.userId) {
          console.log('🔄 Notification listener yeniden başlatılıyor...');
          this.resetNotificationTracking();
          this.startSimpleListener(this.userId);
        }
      }, 15000);
    });

    console.log('🎧 Simple notification listener başlatıldı');
  }

  // Browser notification göster - GÜNCELLEME
  showNotification(data: NotificationData) {
    console.log('🔔 showNotification çağrıldı:', data);
    
    if (typeof window === 'undefined') {
      console.log('❌ Window undefined - server-side rendering');
      return;
    }
    
    if (!('Notification' in window)) {
      console.log('❌ Notification API desteklenmiyor');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('❌ Notification permission:', Notification.permission);
      return;
    }
    
    try {
      console.log('✅ Notification koşulları sağlandı, gösteriliyor...');
      
      // ✅ Service Worker varsa onu kullan (tarayıcı kapalı olsa bile çalışır)
      if (this.serviceWorkerRegistration) {
        console.log('📱 Service Worker notification gösteriliyor...');
        
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
        } as any).then(() => {
          console.log('✅ Service Worker notification başarılı');
          this.playAdvancedNotificationSound();
        }).catch((error) => {
          console.error('❌ Service Worker notification hatası:', error);
          // Fallback to regular notification
          this.showRegularNotification(data);
        });
        
        return;
      }

      // ✅ Fallback: Normal browser notification
      console.log('📋 Regular browser notification gösteriliyor...');
      this.showRegularNotification(data);
      
    } catch (error) {
      console.error('❌ Notification display error:', error);
      
      // Son çare: Alert göster
      if (confirm(`${data.title}\n\n${data.body}\n\nBu bildirimi açmak ister misiniz?`)) {
        window.open(data.data?.url || '/my-quotes', '_blank');
      }
    }
  }

  // ✅ YENİ: Regular notification fallback
  private showRegularNotification(data: NotificationData) {
    try {
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
        console.log('🔔 Notification clicked');
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

      console.log('✅ Regular notification gösterildi:', data.title);
      
      // Ses çal
      this.playAdvancedNotificationSound();
      
    } catch (error) {
      console.error('❌ Regular notification error:', error);
      
      // Son çare fallback
      this.showFallbackNotification(data);
    }
  }

  // ✅ YENİ: Son çare fallback
  private showFallbackNotification(data: NotificationData) {
    console.log('🚨 Fallback notification gösteriliyor...');
    
    // Toast-style notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 350px;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
    `;
    
    toast.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${data.title}</div>
      <div style="font-size: 14px; opacity: 0.9;">${data.body}</div>
      <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">Tıklayın →</div>
    `;
    
    // Click handler
    toast.onclick = () => {
      window.open(data.data?.url || '/my-quotes', '_blank');
      toast.remove();
    };
    
    document.body.appendChild(toast);
    
    // 10 saniye sonra otomatik kaldır
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 10000);
    
    // Ses çal
    this.playAdvancedNotificationSound();
  }

  // Test notification - GÜNCELLEME
  showTestNotification() {
    console.log('🧪 Test notification başlatılıyor...');
    
    const testId = `test-${Date.now()}`;
    const testData = {
      title: '🎉 Test Bildirimi',
      body: 'Notification sistemi test ediliyor! Bu mesajı görüyorsanız her şey çalışıyor 🚀',
      icon: '/favicon.ico',
      tag: testId,
      data: {
        url: '/my-quotes',
        type: 'test',
        timestamp: Date.now()
      }
    };
    
    console.log('🧪 Test data:', testData);
    
    // Önce permission kontrolü yap
    if (Notification.permission !== 'granted') {
      console.log('❌ Test için permission gerekli:', Notification.permission);
      alert('Test bildirimi için önce izin verilmeli! Lütfen "Bildirimleri Aktif Et" butonuna basın.');
      return;
    }
    
    this.showNotification(testData);
  }

  // Sistem durumunu kontrol et - GÜNCELLEME
  getStatus(): { 
    permission: NotificationPermission | 'unsupported';
    isSetup: boolean;
    isListening: boolean;
    shownCount: number;
    hasServiceWorker: boolean;
    hasPushSubscription: boolean;
    debug: any;
  } {
    const debug = {
      hasWindow: typeof window !== 'undefined',
      hasNotificationAPI: typeof window !== 'undefined' && 'Notification' in window,
      permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unknown',
      userId: this.userId,
      serviceWorkerRegistration: !!this.serviceWorkerRegistration,
      pushSubscription: !!this.pushSubscription,
      unsubscribe: !!this.unsubscribe,
      shownIds: this.shownNotificationIds.size
    };
    
    console.log('📊 Notification status debug:', debug);
    
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        permission: 'unsupported',
        isSetup: false,
        isListening: false,
        shownCount: 0,
        hasServiceWorker: false,
        hasPushSubscription: false,
        debug: debug
      };
    }

    return {
      permission: Notification.permission,
      isSetup: !!this.userId,
      isListening: !!this.unsubscribe,
      shownCount: this.shownNotificationIds.size,
      hasServiceWorker: !!this.serviceWorkerRegistration,
      hasPushSubscription: !!this.pushSubscription,
      debug: debug
    };
  }

  // ✅ Bildirimi okundu olarak işaretle
  private async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Mark as read error:', error);
    }
  }

  // ✅ Bildirim sesi çal
  private playAdvancedNotificationSound(): void {
    try {
      if (typeof window === 'undefined') return;
      
      // Modern Audio API kullan
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Kısa bip sesi oluştur
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔊 Notification ses çalındı');
    } catch (error) {
      console.warn('⚠️ Notification ses çalınamadı:', error);
      // Fallback: Sessiz devam et
    }
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
        pushNotificationsEnabled: false, // ✅ Push notification da kapat
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

      // ✅ Service Worker notification'larını da temizle
      if (this.serviceWorkerRegistration) {
        try {
          const notifications = await this.serviceWorkerRegistration.getNotifications();
          notifications.forEach(notification => notification.close());
        } catch (error) {
          console.log('Service Worker notifications temizlenemedi:', error);
        }
      }

      console.log('❌ Notification system disabled');
    } catch (error) {
      console.error('Notification disable error:', error);
      throw error;
    }
  }

  // ✅ Manual bildirim tetikleme fonksiyonu (TEST için)
  triggerTestNotificationFromFirestore() {
    if (!this.userId) {
      console.error('❌ UserId yok, test bildirimi tetiklenemez');
      return;
    }

    console.log('🧪 Firestore\'a test bildirimi ekleniyor...');
    
    // Firestore'a manuel bildirim ekle
    addDoc(collection(db, 'notifications'), {
      userId: this.userId,
      type: 'test',
      title: '🧪 Test Bildirimi (Firestore)',
      message: 'Bu bildirim Firestore üzerinden tetiklendi ve real-time listener tarafından yakalandı!',
      read: false,
      triggered: true,
      createdAt: serverTimestamp(),
      testNotification: true
    }).then((docRef) => {
      console.log('✅ Test bildirimi Firestore\'a eklendi:', docRef.id);
    }).catch((error) => {
      console.error('❌ Test bildirimi eklenemedi:', error);
    });
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
  data?: any;
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
        userId: userId,
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