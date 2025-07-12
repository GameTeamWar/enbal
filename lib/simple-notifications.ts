// lib/simple-notifications.ts - Düzeltilmiş Browser Notification Sistemi

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

      // 2. Real-time dinleme başlat (Basitleştirilmiş query - index gerektirmez)
      this.startSimpleListener(userId);

      // 3. Kullanıcı bilgilerini güncelle
      await updateDoc(doc(db, 'users', userId), {
        browserNotificationsEnabled: true,
        notificationSetupDate: new Date(),
        lastNotificationCheck: new Date()
      });

      // 4. Test notification göster
      this.showNotification({
        title: '🎉 Bildirimler Aktif!',
        body: 'Teklif güncellemeleriniz hakkında bilgilendirileceksiniz.',
        icon: '/favicon.ico',
        tag: 'setup-notification'
      });

      console.log('✅ Simple notification system aktif edildi');
      return true;
    } catch (error) {
      console.error('Notification setup error:', error);
      throw error;
    }
  }

  // Basitleştirilmiş Real-time Firestore dinleyici (Index gerektirmez)
  private startSimpleListener(userId: string) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // SADECE kullanıcı ID'si ile filtreleme - index gerektirmez
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50) // Son 50 bildirimi takip et
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          const notificationTime = notification.createdAt?.toMillis() || Date.now();
          
          // Yeni bir bildirim mi kontrol et (son 1 dakika içinde oluşturulmuş)
          const now = Date.now();
          const isNew = notificationTime > this.lastNotificationTime && 
                       (now - notificationTime) < 60000 && // 1 dakika
                       !notification.read; // Okunmamış

          if (isNew) {
            this.showNotification({
              title: notification.title || 'Enbal Sigorta',
              body: notification.message || 'Yeni bildiriminiz var',
              icon: '/favicon.ico',
              tag: `notification-${change.doc.id}`,
              data: {
                notificationId: change.doc.id,
                url: '/my-quotes',
                type: notification.type
              }
            });
            
            this.lastNotificationTime = Math.max(this.lastNotificationTime, notificationTime);
          }
        }
      });
    }, (error) => {
      console.error('Notification listener error:', error);
      // Hata durumunda 15 saniye sonra tekrar dene
      setTimeout(() => {
        if (this.userId) {
          console.log('🔄 Notification listener yeniden başlatılıyor...');
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
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: data.tag || 'enbal-notification',
        requireInteraction: true,
        silent: false
      });

      // Notification click event
      notification.onclick = () => {
        window.focus();
        
        // Notification verilerini kontrol et
        if (data.data?.url) {
          window.location.href = data.data.url;
        } else {
          window.location.href = '/my-quotes';
        }
        
        // Notification'ı kapat
        notification.close();
        
        // Eğer notificationId varsa, okundu olarak işaretle
        if (data.data?.notificationId) {
          this.markAsRead(data.data.notificationId);
        }
      };

      // 15 saniye sonra otomatik kapat
      setTimeout(() => {
        notification.close();
      }, 15000);

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
        readAt: new Date()
      });
      console.log('📖 Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  // Test notification
  showTestNotification() {
    this.showNotification({
      title: '🎉 Test Bildirimi',
      body: 'Browser notification sistemi mükemmel çalışıyor! 🚀',
      icon: '/favicon.ico',
      tag: 'test-notification',
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
  } {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        permission: 'unsupported',
        isSetup: false,
        isListening: false
      };
    }

    return {
      permission: Notification.permission,
      isSetup: !!this.userId,
      isListening: !!this.unsubscribe
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

      // Instance'ı temizle
      this.userId = null;
      this.lastNotificationTime = 0;

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