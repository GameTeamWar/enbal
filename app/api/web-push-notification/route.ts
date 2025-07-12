import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    
    // Browser notification sistemi kullanıyoruz, FCM değil
    if (!userData.browserNotificationsEnabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcının browser bildirimleri kapalı',
        type: 'notifications_disabled'
      });
    }

    // Browser notification başarılı olarak işaretle
    // Gerçek bildirim client-side'da real-time listener ile gönderilir
    console.log('Browser notification tetiklendi:', {
      userId,
      title,
      body,
      type: 'browser_notification'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Browser notification sistemi aktif - bildirim gönderilecek',
      type: 'browser_ready'
    });

  } catch (error: any) {
    console.error('Browser notification API hatası:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Browser notification işlenemedi',
      error: error.message,
      type: 'api_error'
    }, { status: 500 });
  }
}

// Toplu bildirim endpoint'i
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { userIds, title, body } = data;

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
          
          if (userData.browserNotificationsEnabled) {
            results.push({ userId, success: true, type: 'browser_enabled' });
          } else {
            results.push({ userId, success: false, reason: 'Browser notifications disabled' });
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
      message: 'Toplu browser notification işlemi tamamlandı',
      results: results
    });

  } catch (error: any) {
    console.error('Toplu browser notification hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Toplu browser notification işlenemedi',
      error: error.message
    }, { status: 500 });
  }
}