import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email ayarları - FIXED
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'enbal50@gmail.com',
    pass: process.env.EMAIL_PASS || 'vzpuhqgflicyruyk'
  },
  tls: {
    rejectUnauthorized: false
  }
};

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1 || 'enbal50@gmail.com',
  process.env.ADMIN_EMAIL_2 || 'enbal50@gmail.com'
];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { quoteId, customerName, insuranceType, price, paymentInfo } = data;

    // Admin'e kart bilgileri bildirimi gönder
    await sendCardInfoNotification({
      quoteId,
      customerName,
      insuranceType,
      price,
      paymentInfo
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Kart bilgileri bildirimi gönderildi' 
    });

  } catch (error) {
    console.error('Kart bilgileri bildirimi hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Bildirim gönderilemedi' 
    }, { status: 500 });
  }
}

async function sendCardInfoNotification({ quoteId, customerName, insuranceType, price, paymentInfo }: {
  quoteId: string;
  customerName: string;
  insuranceType: string;
  price: string;
  paymentInfo: any;
}) {
  try {
    console.log('📧 Kart bilgileri email gönderiliyor...');
    
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    // SMTP bağlantısını test et
    await transporter.verify();
    console.log('✅ SMTP bağlantısı başarılı (payment notification)');

    const mailOptions = {
      from: `"Enbal Sigorta Sistem" <${EMAIL_CONFIG.auth.user}>`,
      to: ADMIN_EMAILS.join(','),
      subject: `💳 Kart Bilgileri Alındı - Teklif ID: ${quoteId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0;">💳 Kart Bilgileri Alındı!</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3 style="color: #333; margin-top: 0;">Ödeme Detayları</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Teklif ID:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${quoteId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Müşteri:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Sigorta Türü:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${insuranceType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Tutar:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333; font-weight: bold; color: #10b981;">
                  ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(price))}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Kart Sahibi:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${paymentInfo.cardHolder}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Kart No:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">**** **** **** ${paymentInfo.cardNumber.slice(-4)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Taksit:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${paymentInfo.installments === '1' ? 'Tek Çekim' : paymentInfo.installments + ' Taksit'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Bilgi Alınma Tarihi:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${new Date().toLocaleString('tr-TR')}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Admin Paneline Git
              </a>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong>📄 Önemli:</strong> Müşteri kart bilgilerini gönderdi. Lütfen ödemeyi yapın ve belgeleri hazırlayıp sisteme yükleyin.
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Kart bilgileri email gönderildi:', result.messageId);
    
  } catch (error: any) {
    console.error('❌ Kart bilgileri email hatası:', {
      error: error.message,
      code: error.code
    });
    throw error;
  }
}