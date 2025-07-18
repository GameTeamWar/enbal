import { NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { userId, subscription } = await request.json();

    if (!userId || !subscription) {
      return NextResponse.json({ 
        success: false, 
        message: 'userId ve subscription gerekli' 
      }, { status: 400 });
    }

    // Kullanıcı document'ini güncelle
    await updateDoc(doc(db, 'users', userId), {
      pushSubscription: subscription,
      pushNotificationsEnabled: true,
      pushSubscriptionDate: new Date(),
      lastPushUpdate: new Date()
    });

    console.log('✅ Push subscription kaydedildi:', userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription kaydedildi' 
    });

  } catch (error: any) {
    console.error('❌ Push subscription kayıt hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Push subscription kaydedilemedi',
      error: error.message
    }, { status: 500 });
  }
}
