// lib/simple-notifications.ts - FCM olmadan basit notification sistemi

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Interface for notification data
interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

// Browser notification wrapper
export class SimpleNotificationManager {
  private static instance: SimpleNotificationManager;
  private userId: string | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): SimpleNotificationManager {
    if (!SimpleNotificationManager.instance) {
      SimpleNotificationManager.instance = new SimpleNotificationManager();
    }
    return SimpleNotificationManager.instance;
  }

  // Notification izni alma
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('❌ Browser notification desteklemiyor');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
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
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // Kullanıcı için notification aktif olduğunu işaretle
      await updateDoc(doc(db, 'users', userId), {
        browserNotificationsEnabled: true,
        notificationSetupDate: new Date()
      });

      // Periyodik kontrol başlat (Real-time yerine polling)
      this.startPolling(userId);

      console.log('✅ Simple notification system aktif edildi');
      return true;
    } catch (error) {
      console.error('Notification setup error:', error);
      throw error;
    }
  }

  // Bildirim polling sistemi (Real-time Firestore dinleme yerine)
  private startPolling(userId: string) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Her 30 saniyede bir notification kontrol et
    this.checkInterval = setInterval(async () => {
      await this.checkForNewNotifications(userId);
    }, 30000);

    console.log('🔄 Notification polling started');
  }

  // Yeni bildirimleri kontrol et
  private async checkForNewNotifications(userId: string) {
    try {
      const response = await fetch('/api/check-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.newNotifications && result.newNotifications.length > 0) {
        for (const notification of result.newNotifications) {
          this.showNotification(notification);
        }
      }
    } catch (error) {
      console.error('❌ Notification check error:', error);
    }
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
        data: data.data
      });

      notification.onclick = () => {
        window.focus();
        if (data.data?.url) {
          window.location.href = data.data.url;
        } else {
          window.location.href = '/my-quotes';
        }
        notification.close();
      };

      // 10 saniye sonra otomatik kapat
      setTimeout(() => {
        notification.close();
      }, 10000);

      console.log('📨 Notification gösterildi:', data.title);
    } catch (error) {
      console.error('Notification display error:', error);
    }
  }

  // Test notification
  showTestNotification() {
    this.showNotification({
      title: '🎉 Test Bildirimi',
      body: 'Browser notification sistemi çalışıyor!',
      icon: '/favicon.ico',
      tag: 'test-notification'
    });
  }

  // Notification sistemini kapat
  async disable(userId: string) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        browserNotificationsEnabled: false,
        notificationDisabledDate: new Date()
      });

      console.log('❌ Notification system disabled');
    } catch (error) {
      console.error('Notification disable error:', error);
      throw error;
    }
  }

  // Polling durdur
  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Notification polling stopped');
    }
  }
}

// Kolay kullanım için wrapper fonksiyonlar
export const setupSimpleNotifications = async (userId: string): Promise<boolean> => {
  try {
    const manager = SimpleNotificationManager.getInstance();
    return await manager.setupForUser(userId);
  } catch (error) {
    console.error('Setup simple notifications error:', error);
    return false;
  }
};

export const showTestNotification = () => {
  try {
    const manager = SimpleNotificationManager.getInstance();
    manager.showTestNotification();
  } catch (error) {
    console.error('Show test notification error:', error);
  }
};

export const disableNotifications = async (userId: string) => {
  try {
    const manager = SimpleNotificationManager.getInstance();
    await manager.disable(userId);
  } catch (error) {
    console.error('Disable notifications error:', error);
  }
};

// Instant notification gönder (Server-side'dan tetiklenir)
export const sendInstantNotification = async (userId: string, notificationData: {
  title: string;
  body: string;
  type: string;
}) => {
  try {
    const response = await fetch('/api/send-instant-notification', {
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
    console.error('❌ Instant notification error:', error);
    return { success: false, error: error.message };
  }
};