import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email ayarları
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1 || 'admin1@enbalsigorta.com',
  process.env.ADMIN_EMAIL_2 || 'admin2@enbalsigorta.com'
];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { quoteId, customerName, insuranceType, price, paymentInfo } = data;

    // Admin'e ödeme bildirimi gönder
    await sendPaymentNotification({
      quoteId,
      customerName,
      insuranceType,
      price,
      paymentInfo
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ödeme bildirimi gönderildi' 
    });

  } catch (error) {
    console.error('Ödeme bildirimi hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Bildirim gönderilemedi' 
    }, { status: 500 });
  }
}

async function sendPaymentNotification({ quoteId, customerName, insuranceType, price, paymentInfo }: {
  quoteId: string;
  customerName: string;
  insuranceType: string;
  price: string;
  paymentInfo: any;
}) {
  try {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: ADMIN_EMAILS.join(','),
      subject: `💳 Ödeme Alındı - Teklif ID: ${quoteId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0;">💳 Ödeme Alındı!</h2>
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
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Taksit:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${paymentInfo.installments === '1' ? 'Tek Çekim' : paymentInfo.installments + ' Taksit'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Ödeme Tarihi:</td>
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
              <strong>📄 Önemli:</strong> Müşteri ödemeyi tamamladı. Lütfen belgeleri hazırlayıp sisteme yükleyin.
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Ödeme bildirimi gönderildi');
  } catch (error) {
    console.error('Email gönderim hatası:', error);
    throw error;
  }
}