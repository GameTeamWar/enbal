// app/api/trigger-browser-notification/route.ts
import { NextResponse } from 'next/server';
import { doc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, title, body, type, quoteId, insuranceType } = data;

    if (!userId || !title || !body) {
      return NextResponse.json({ 
        success: false, 
        message: 'userId, title ve body parametreleri gerekli' 
      }, { status: 400 });
    }

    // Kullanıcının bildirim ayarlarını kontrol et
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData.browserNotificationsEnabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcının browser bildirimleri kapalı',
        type: 'notifications_disabled'
      });
    }

    // ✅ 1. Firestore'a bildirim kaydet (real-time listener için)
    const notificationData = {
      userId,
      type,
      quoteId: quoteId || null,
      insuranceType: insuranceType || null,
      title,
      message: body,
      read: false,
      triggered: true,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    
    // ✅ 2. Push Notification gönder (tarayıcı kapalı olsa bile çalışır)
    if (userData.pushSubscription && userData.pushNotificationsEnabled) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            title,
            body,
            data: {
              url: '/my-quotes',
              quoteId,
              type,
              notificationId: docRef.id
            }
          }),
        });
        
        console.log('✅ Push notification da gönderildi');
      } catch (pushError) {
        console.error('⚠️ Push notification hatası:', pushError);
        // Push notification hatası olsa bile normal notification devam eder
      }
    }
    
    console.log('✅ Browser notification tetiklendi:', {
      notificationId: docRef.id,
      userId,
      title,
      type,
      hasPushSubscription: !!userData.pushSubscription
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Notification gönderildi (browser + push)',
      notificationId: docRef.id,
      type: 'enhanced_notification',
      pushSent: !!userData.pushSubscription
    });

  } catch (error: any) {
    console.error('❌ Enhanced notification trigger hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Notification tetiklenemedi',
      error: error.message
    }, { status: 500 });
  }
}

// Toplu bildirim tetikleme
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { userIds, title, body, type } = data;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'userIds array gerekli' 
      }, { status: 400 });
    }

    const results = [];
    
    for (const userId of userIds) {
      try {
        // Her kullanıcı için ayrı bildirim oluştur
        const notificationData = {
          userId,
          type: type || 'general',
          title: title || 'Enbal Sigorta',
          message: body || 'Yeni bildiriminiz var',
          read: false,
          triggered: true,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        results.push({ 
          userId, 
          success: true, 
          notificationId: docRef.id 
        });
        
      } catch (error: any) {
        results.push({ 
          userId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Toplu browser notification işlemi tamamlandı',
      results: results
    });

  } catch (error: any) {
    console.error('❌ Toplu browser notification hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Toplu browser notification tetiklenemedi',
      error: error.message
    }, { status: 500 });
  }
}