'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });

  // Telefon numarası formatlaması
  const formatPhone = (value: string) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    
    // 0 ile başlamazsa 0 ekle
    let formatted = numbers;
    if (formatted.length > 0 && !formatted.startsWith('0')) {
      formatted = '0' + formatted;
    }
    
    // Maksimum 11 karakter (05XXXXXXXXX)
    formatted = formatted.slice(0, 11);
    
    // Format: 05XX XXX XX XX
    if (formatted.length > 4) {
      formatted = formatted.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    } else if (formatted.length > 2) {
      formatted = formatted.replace(/(\d{4})(\d{1,3})/, '$1 $2');
    }
    
    return formatted;
  };

  // Telefon numarası validasyonu
  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^05[0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Telefon numarası validasyonu
      if (!validatePhone(formData.phone)) {
        toast.error('Geçerli bir telefon numarası giriniz! (05XXXXXXXXX)');
        return;
      }

      if (!formData.password) {
        toast.error('Şifre alanı zorunludur!');
        return;
      }

      const cleanPhone = formData.phone.replace(/\s/g, '');
      
      console.log('🔄 Giriş işlemi başlıyor...', {
        phone: cleanPhone
      });

      // Telefon numarasını email formatına çevir (Register'da kullanılan format)
      const email = `${cleanPhone}@enbalsigorta.local`;

      // Firebase Auth ile giriş
      await signInWithEmailAndPassword(auth, email, formData.password);
      
      console.log('✅ Giriş başarılı');
      toast.success('🎉 Giriş başarılı! Yönlendiriliyorsunuz...');
      
      // Profile sayfasına yönlendir
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Giriş hatası:', error);
      
      // Firebase hata kodlarına göre özel mesajlar
      let errorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı!';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Hatalı şifre! Lütfen tekrar deneyin.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Geçersiz telefon numarası!';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Bu hesap devre dışı bırakılmış!';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Çok fazla başarısız deneme! Lütfen daha sonra tekrar deneyin.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Ağ bağlantısı hatası! İnternet bağlantınızı kontrol edin.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Telefon numarası veya şifre hatalı!';
            break;
          default:
            errorMessage = `Giriş hatası: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Giriş Yap</h2>
          <p className="text-gray-600 mt-2">Telefon numaranız ile hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Telefon Numarası</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="05XX XXX XX XX"
              maxLength={13}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-purple-600 hover:text-purple-700 text-sm">
            Şifremi Unuttum
          </Link>
          <span className="text-gray-400 mx-2">|</span>
          <Link href="/register" className="text-purple-600 hover:text-purple-700 text-sm">
            Kayıt Ol
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-700 text-sm">
            ← Ana Sayfaya Dön
          </Link>
        </div>

        {/* Demo hesap bilgileri */}
       
       
      </div>
    </div>
  );
}