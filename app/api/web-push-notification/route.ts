import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Firebase Admin SDK için (server-side)
const admin = require('firebase-admin');

// Firebase Admin SDK'yı initialize et (sadece bir kez)
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "enbal-c028e",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || "enbal-c028e"
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, title, body, icon, quoteId, insuranceType } = data;

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID gerekli' 
      }, { status: 400 });
    }

    // Kullanıcı bilgilerini al
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      }, { status: 404 });
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      // FCM token yoksa sadece in-app notification
      return NextResponse.json({ 
        success: true, 
        message: 'FCM token bulunamadı, sadece in-app notification gönderildi',
        type: 'in-app-only'
      });
    }

    // FCM notification payload'ı oluştur
    const message = {
      token: fcmToken,
      notification: {
        title: title || 'Enbal Sigorta',
        body: body || 'Yeni bir bildiriminiz var',
        icon: icon || '/favicon.ico'
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        url: '/my-quotes',
        quoteId: quoteId || '',
        insuranceType: insuranceType || '',
        userId: userId,
        timestamp: new Date().toISOString()
      },
      webpush: {
        headers: {
          'TTL': '86400', // 24 saat
          'Urgency': 'high'
        },
        notification: {
          title: title || 'Enbal Sigorta',
          body: body || 'Yeni bir bildiriminiz var',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          image: '/logo-notification.png',
          tag: `quote-${quoteId || 'general'}`,
          requireInteraction: true,
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
          ],
          data: {
            url: '/my-quotes',
            quoteId: quoteId || ''
          }
        },
        fcm_options: {
          link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://enbalsigorta.com'}/my-quotes`
        }
      }
    };

    // FCM üzerinden notification gönder
    const response = await admin.messaging().send(message);
    
    console.log('Push notification başarıyla gönderildi:', response);

    return NextResponse.json({ 
      success: true, 
      message: 'Push notification başarıyla gönderildi',
      messageId: response,
      type: 'push-sent'
    });

  } catch (error: any) {
    console.error('Push notification hatası:', error);
    
    // FCM token geçersizse kullanıcıdan kaldır
    if (error.code === 'messaging/registration-token-not-registered' || 
        error.code === 'messaging/invalid-registration-token') {
      try {
        await updateDoc(doc(db, 'users', data.userId), {
          fcmToken: null
        });
        console.log('Geçersiz FCM token kaldırıldı');
      } catch (updateError) {
        console.error('FCM token kaldırma hatası:', updateError);
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Push notification gönderilemedi',
      error: error.message,
      type: 'push-failed'
    }, { status: 500 });
  }
}

// Toplu bildirim gönderme endpoint'i
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { userIds, title, body, icon } = data;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'User IDs array gerekli' 
      }, { status: 400 });
    }

    const results = [];
    
    for (const userId of userIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fcmToken = userData.fcmToken;
          
          if (fcmToken) {
            const message = {
              token: fcmToken,
              notification: {
                title: title || 'Enbal Sigorta',
                body: body || 'Yeni bir bildiriminiz var',
                icon: icon || '/favicon.ico'
              },
              data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                url: '/my-quotes',
                userId: userId,
                timestamp: new Date().toISOString()
              }
            };

            const response = await admin.messaging().send(message);
            results.push({ userId, success: true, messageId: response });
          } else {
            results.push({ userId, success: false, reason: 'No FCM token' });
          }
        } else {
          results.push({ userId, success: false, reason: 'User not found' });
        }
      } catch (error: any) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Toplu bildirim işlemi tamamlandı',
      results: results
    });

  } catch (error: any) {
    console.error('Toplu push notification hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Toplu push notification gönderilemedi',
      error: error.message
    }, { status: 500 });
  }
}