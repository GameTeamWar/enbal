import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email ayarları - Bu bilgileri environment variables olarak saklamanız önerilir
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com', // veya kullandığınız SMTP servisi
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Admin email adresleri - Environment variable olarak saklanabilir
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1 || 'admin1@enbalsigorta.com',
  process.env.ADMIN_EMAIL_2 || 'admin2@enbalsigorta.com'
];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { type, insuranceType, customerName, customerPhone } = data;

    if (type === 'new_quote') {
      // Email gönderme
      await sendEmailNotification({
        insuranceType,
        customerName,
        customerPhone
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Bildirimler gönderildi' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Geçersiz bildirim türü' 
    }, { status: 400 });

  } catch (error) {
    console.error('Bildirim gönderim hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Bildirim gönderilemedi' 
    }, { status: 500 });
  }
}

async function sendEmailNotification({ insuranceType, customerName, customerPhone }: {
  insuranceType: string;
  customerName: string;
  customerPhone: string;
}) {
  try {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: ADMIN_EMAILS.join(','),
      subject: `🚨 Yeni Teklif Talebi - ${insuranceType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0;">🚨 Yeni Teklif Talebi</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3 style="color: #333; margin-top: 0;">Teklif Detayları</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Sigorta Türü:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${insuranceType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Müşteri Adı:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Telefon:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">
                  <a href="tel:${customerPhone}" style="color: #667eea; text-decoration: none;">${customerPhone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Tarih:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${new Date().toLocaleString('tr-TR')}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Admin Paneline Git
              </a>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email bildirimi gönderildi');
  } catch (error) {
    console.error('Email gönderim hatası:', error);
    throw error;
  }
}