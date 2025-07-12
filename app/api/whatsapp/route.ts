import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // WhatsApp API entegrasyonu burada yapılacak
    // Şimdilik sadece konsola yazdırıyoruz
    console.log('Teklif talebi:', data);
    
    // Gerçek uygulamada WhatsApp Business API kullanılacak
    // const whatsappApiUrl = 'YOUR_WHATSAPP_API_URL';
    // const response = await fetch(whatsappApiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': 'Bearer YOUR_API_TOKEN',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: data.phone,
    //     message: `Yeni teklif talebi: ${data.insuranceType} sigortası`
    //   })
    // });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
}