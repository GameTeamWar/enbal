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
  // ✅ Çoklu bildirim engelleyici - gösterilen bildirim ID'lerini takip et
  private shownNotificationIds: Set<string> = new Set();
  private isInitialLoad: boolean = true;

  static getInstance(): SimpleBrowserNotifications {
    if (!SimpleBrowserNotifications.instance) {
      SimpleBrowserNotifications.instance = new SimpleBrowserNotifications();
    }
    return SimpleBrowserNotifications.instance;
  }

  // Browser notification izni alma
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
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  // Kullanıcı için notification sistemi kurma
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

      // 4. Kullanıcı bilgilerini güncelle
      await updateDoc(doc(db, 'users', userId), {
        browserNotificationsEnabled: true,
        notificationSetupDate: new Date(),
        lastNotificationCheck: new Date()
      });

      // 5. Setup notification göster (sadece ilk kurulumda)
      setTimeout(() => {
        this.showNotification({
          title: '🎉 Bildirimler Aktif!',
          body: 'Teklif güncellemeleriniz hakkında bilgilendirileceksiniz.',
          icon: '/favicon.ico',
          tag: 'setup-notification'
        });
      }, 1000);

      console.log('✅ Simple notification system aktif edildi');
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

  // Browser notification göster
  showNotification(data: NotificationData) {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      console.log('❌ Notifications not available or permission not granted');
      return;
    }
    
    try {
      // ✅ Aynı tag'li notification varsa önce kapat
      if (data.tag) {
        // Eski notification'ı kapat (varsa)
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
        tag: data.tag || `enbal-notification-${Date.now()}`, // Unique tag garantisi
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
      this.playSimpleNotificationSound();
      
    } catch (error) {
      console.error('Notification display error:', error);
    }
  }

  // Basit sistem sesi - dosya gerektirmez
  private playSimpleNotificationSound() {
    try {
      // Web Audio API ile basit notification sesi oluştur
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // İki tonlu notification sesi
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // İlk ton
        oscillator1.frequency.value = 800;
        oscillator1.type = 'sine';
        
        // İkinci ton (harmonik)
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        
        // Ses seviyesi
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        // Sesi başlat ve durdur
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.15);
        
        oscillator2.start(audioContext.currentTime + 0.1);
        oscillator2.stop(audioContext.currentTime + 0.25);
        
        console.log('🔊 Notification sesi çalındı');
      }
    } catch (error: any) {
      console.log('Ses çalma hatası (normal):', error.message);
      // Ses çalmazsa sorun değil, notification yine de gösterilir
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

  // Test notification
  showTestNotification() {
    const testId = `test-${Date.now()}`;
    this.showNotification({
      title: '🎉 Test Bildirimi',
      body: 'Browser notification sistemi mükemmel çalışıyor! 🚀',
      icon: '/favicon.ico',
      tag: testId,
      data: {
        url: '/my-quotes',
        type: 'test'
      }
    });
  }

  // Sistem durumunu kontrol et
  getStatus(): { 
    permission: NotificationPermission | 'unsupported';
    isSetup: boolean;
    isListening: boolean;
    shownCount: number;
  } {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        permission: 'unsupported',
        isSetup: false,
        isListening: false,
        shownCount: 0
      };
    }

    return {
      permission: Notification.permission,
      isSetup: !!this.userId,
      isListening: !!this.unsubscribe,
      shownCount: this.shownNotificationIds.size
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