// app/api/admin-notification/route.ts - Enbal Sigorta Email Configuration
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ✅ ENBAL SİGORTA EMAİL AYARLARI - FIXED
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'enbal50@gmail.com',
    pass: process.env.EMAIL_PASS || 'vzpuhqgflicyruyk'
  },
  // Gmail için ek ayarlar
  tls: {
    rejectUnauthorized: false
  }
};

// Debug için email konfigürasyonunu kontrol et
console.log('🔧 Email Config Debug:', {
  user: EMAIL_CONFIG.auth.user,
  hasPassword: !!EMAIL_CONFIG.auth.pass,
  passwordLength: EMAIL_CONFIG.auth.pass?.length,
  isAppPassword: EMAIL_CONFIG.auth.pass?.length === 16,
  actualPassword: process.env.NODE_ENV === 'development' ? EMAIL_CONFIG.auth.pass : '***hidden***'
});

// ✅ ENBAL SİGORTA ADMIN EMAİL ADRESLERİ
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1 || 'saimesari@enbalsigorta.com',
  process.env.ADMIN_EMAIL_2 || 'enbal50@gmail.com'
];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { type, insuranceType, customerName, customerPhone } = data;

    console.log('📧 Email bildirimi gönderiliyor:', {
      type,
      insuranceType,
      customerName,
      customerPhone: customerPhone?.substring(0, 7) + '****'
    });

    if (type === 'new_quote') {
      // ✅ Email gönderme - Enhanced error handling
      const emailResult = await sendEmailNotification({
        insuranceType,
        customerName,
        customerPhone
      });

      if (emailResult.success) {
        console.log('✅ Email bildirimi başarıyla gönderildi');
        return NextResponse.json({ 
          success: true, 
          message: 'Email bildirimi gönderildi',
          details: emailResult.details
        });
      } else {
        console.error('❌ Email gönderimi başarısız:', emailResult.error);
        return NextResponse.json({ 
          success: false, 
          message: 'Email gönderilemedi',
          error: emailResult.error
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Geçersiz bildirim türü' 
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Email bildirim hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Email bildirimi gönderilemedi',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    }, { status: 500 });
  }
}

async function sendEmailNotification({ insuranceType, customerName, customerPhone }: {
  insuranceType: string;
  customerName: string;
  customerPhone: string;
}): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('📤 Gmail SMTP ile email gönderiliyor...', {
      from: EMAIL_CONFIG.auth.user,
      to: ADMIN_EMAILS.join(', '),
      configCheck: {
        hasUser: !!EMAIL_CONFIG.auth.user,
        hasPass: !!EMAIL_CONFIG.auth.pass,
        passLength: EMAIL_CONFIG.auth.pass?.length,
        passPreview: EMAIL_CONFIG.auth.pass?.substring(0, 4) + '****'
      }
    });

    const transporter = nodemailer.createTransport({
      ...EMAIL_CONFIG,
      debug: process.env.NODE_ENV === 'development', // Sadece development'ta debug
      logger: process.env.NODE_ENV === 'development'
    });

    // ✅ SMTP bağlantısını test et
    console.log('🔍 SMTP bağlantısı test ediliyor...');
    
    try {
      await transporter.verify();
      console.log('✅ SMTP bağlantısı başarılı');
    } catch (verifyError: any) {
      console.error('❌ SMTP verify failed:', verifyError.message);
      return {
        success: false,
        error: `SMTP bağlantı hatası: ${verifyError.message}`
      };
    }

    const mailOptions = {
      from: `"Enbal Sigorta Sistem" <${EMAIL_CONFIG.auth.user}>`,
      to: ADMIN_EMAILS.join(','),
      subject: `🚨 YENİ TEKLİF TALEBİ - ${insuranceType} Sigortası`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">🚨 YENİ TEKLİF TALEBİ</div>
            <div style="font-size: 16px; opacity: 0.9;">${insuranceType} Sigortası</div>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 30px 20px; margin: 0;">
            <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📋 Müşteri Bilgileri</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #555; width: 140px;">👤 Müşteri Adı:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333; font-weight: 500;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">📞 Telefon:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333;">
                  <a href="tel:${customerPhone}" style="color: #667eea; text-decoration: none; font-weight: 500; padding: 6px 12px; background: #f0f4ff; border-radius: 6px; display: inline-block;">
                    ${customerPhone}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">🛡️ Sigorta Türü:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333;">
                  <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 6px 12px; border-radius: 6px; font-weight: 500; display: inline-block;">
                    ${insuranceType}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #555;">📅 Talep Tarihi:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333; font-weight: 500;">${new Date().toLocaleString('tr-TR', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Istanbul'
                })}</td>
              </tr>
            </table>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://enbalsigorta.com'}/admin" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-right: 15px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                🖥️ Admin Paneli
              </a>
              
              <a href="https://wa.me/90${customerPhone.replace(/\D/g, '')}" 
                 style="background: linear-gradient(135deg, #25d366 0%, #128c7e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);">
                💬 WhatsApp
              </a>
            </div>
            
            <!-- Important Notice -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 25px 0;">
              <div style="display: flex; align-items: flex-start;">
                <div style="font-size: 24px; margin-right: 15px;">⚡</div>
                <div>
                  <div style="font-weight: bold; color: #92400e; margin-bottom: 8px; font-size: 16px;">HIZLI YANIT GEREKLİ</div>
                  <div style="color: #b45309; font-size: 14px; line-height: 1.5;">
                    Bu teklif talebine <strong>en kısa sürede</strong> cevap verilmesi gerekmektedir.<br>
                    Müşteri memnuniyeti için 30 dakika içinde ilk iletişimi kurmanız önerilir.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">🛡️ Enbal Sigorta</div>
            <div style="opacity: 0.8; font-size: 14px; margin-bottom: 10px;">Güvenli Yarınlar İçin Doğru Adres</div>
            <div style="opacity: 0.7; font-size: 12px;">
              Bu email otomatik olarak gönderilmiştir • ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
            </div>
          </div>
        </div>
      `
    };

    console.log('📤 Email gönderiliyor...', {
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email başarıyla gönderildi:', {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response
    });

    return {
      success: true,
      details: {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      }
    };

  } catch (error: any) {
    console.error('❌ Email gönderim hatası detayı:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Gmail özel hata mesajları
    let errorMessage = error.message;
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail uygulama şifresi hatalı. Lütfen doğru app password kullanın.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Gmail SMTP sunucusuna bağlanılamıyor.';
    } else if (error.responseCode === 535) {
      errorMessage = 'Gmail kimlik doğrulama başarısız. App password kontrol edin.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}