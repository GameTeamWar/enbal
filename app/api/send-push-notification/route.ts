import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import webpush from 'web-push';

// VAPID keys configuration
webpush.setVapidDetails(
  'mailto:admin@enbalsigorta.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NMtg3-k6RJOjDZksP-0k0BoHKn8ZGNxSHqXp4AKZeM6R7lbOOyQO0E',
  process.env.VAPID_PRIVATE_KEY || 'cMcGsONWxhIhF8v_XLlH9A-T8dV1J5Eb7JkS6yQqx9I'
);

export async function POST(request: Request) {
  try {
    const { userId, title, body, data } = await request.json();

    if (!userId || !title) {
      return NextResponse.json({ 
        success: false, 
        message: 'userId ve title gerekli' 
      }, { status: 400 });
    }

    // Kullanıcının push subscription'ını al
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      }, { status: 404 });
    }

    const userData = userDoc.data();
    
    if (!userData.pushSubscription) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcının push subscription\'ı yok' 
      }, { status: 400 });
    }

    // Push notification payload
    const payload = JSON.stringify({
      title: title,
      body: body || 'Yeni bildiriminiz var',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `enbal-${Date.now()}`,
      requireInteraction: true,
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
      data: data || { url: '/my-quotes' }
    });

    // Push notification gönder
    await webpush.sendNotification(userData.pushSubscription, payload);

    console.log('✅ Push notification gönderildi:', userId, title);

    return NextResponse.json({ 
      success: true, 
      message: 'Push notification gönderildi' 
    });

  } catch (error: any) {
    console.error('❌ Push notification hatası:', error);
    
    // Subscription invalid ise kullanıcı kaydını temizle
    if (error.statusCode === 410) {
      try {
        const { userId } = await request.json();
        await updateDoc(doc(db, 'users', userId), {
          pushSubscription: null,
          pushNotificationsEnabled: false
        });
        console.log('🗑️ Invalid subscription temizlendi:', userId);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Push notification gönderilemedi',
      error: error.message
    }, { status: 500 });
  }
}
