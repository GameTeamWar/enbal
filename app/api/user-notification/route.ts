// app/api/user-notification/route.ts
import { NextResponse } from 'next/server';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// lib/firebase.ts'den import et - TEKRAR BAŞLATMA!
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, type, quoteId, insuranceType, message, price, reason, documentUrl } = data;

    // Bildirim mesajını oluştur
    let notificationMessage = '';
    let notificationTitle = '';
    
    switch (type) {
      case 'quote_response':
        notificationTitle = 'Teklif Cevabı Geldi';
        notificationMessage = `${insuranceType} sigortası teklifiniz cevaplandı. ${price ? `Fiyat: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(price))}` : ''}`;
        break;
      case 'quote_rejected':
        notificationTitle = 'Teklif Reddedildi';
        notificationMessage = `${insuranceType} sigortası teklifiniz reddedildi. ${reason ? `Sebep: ${reason}` : ''}`;
        break;
      case 'document_ready':
        notificationTitle = 'Belgeleriniz Hazır';
        notificationMessage = `${insuranceType} sigortası belgeleriniz hazır! İndirebilirsiniz.`;
        break;
      default:
        notificationTitle = 'Teklif Güncellendi';
        notificationMessage = `${insuranceType} teklifiniz güncellendi`;
    }

    // Bildirimi veritabanına kaydet
    const notificationData = {
      userId,
      type,
      quoteId,
      insuranceType,
      title: notificationTitle,
      message: notificationMessage,
      originalMessage: message,
      price,
      reason,
      documentUrl,
      read: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), notificationData);

    return NextResponse.json({ 
      success: true, 
      message: 'Bildirim gönderildi' 
    });

  } catch (error) {
    console.error('Kullanıcı bildirimi hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Bildirim gönderilemedi' 
    }, { status: 500 });
  }
}