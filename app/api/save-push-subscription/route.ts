import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    console.log('📥 Push subscription API çağrıldı');
    
    const body = await request.json();
    console.log('📄 Request body:', { userId: body.userId, hasSubscription: !!body.subscription });
    
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      console.error('❌ Eksik parametreler:', { userId: !!userId, subscription: !!subscription });
      return NextResponse.json({ 
        success: false, 
        message: 'userId ve subscription gerekli',
        received: { userId: !!userId, subscription: !!subscription }
      }, { status: 400 });
    }

    // Admin SDK ile kullanıcının var olup olmadığını kontrol et
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('❌ Kullanıcı bulunamadı:', userId);
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      }, { status: 404 });
    }

    // Admin SDK ile kullanıcı document'ini güncelle
    await userRef.update({
      pushSubscription: subscription,
      pushNotificationsEnabled: true,
      pushSubscriptionDate: new Date(),
      lastPushUpdate: new Date()
    });

    console.log('✅ Push subscription kaydedildi (Admin SDK):', userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription başarıyla kaydedildi',
      userId: userId
    });

  } catch (error: any) {
    console.error('❌ Push subscription API hatası:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({ 
      success: false, 
      message: 'Push subscription kaydedilemedi',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
