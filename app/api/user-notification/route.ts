import { NextResponse } from 'next/server';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, type, quoteId, insuranceType, message, price, reason, documentUrl } = data;

    // Bildirim mesajını oluştur
    let notificationMessage = '';
    switch (type) {
      case 'quote_response':
        notificationMessage = `Teklif ID: ${quoteId} - Cevaplandı`;
        break;
      case 'quote_rejected':
        notificationMessage = `Teklif ID: ${quoteId} - Reddedildi`;
        break;
      case 'document_ready':
        notificationMessage = `Teklif ID: ${quoteId} - Belgeleriniz hazır`;
        break;
      default:
        notificationMessage = `Teklif ID: ${quoteId} - Güncellendi`;
    }

    // Bildirimi veritabanına kaydet
    const notificationData = {
      userId,
      type,
      quoteId,
      insuranceType,
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