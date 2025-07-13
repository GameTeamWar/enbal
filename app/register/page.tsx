'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Temel bilgiler
    name: '',
    surname: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Detay bilgiler
    tcno: '',
    birthdate: '',
    address: '',
    // Araç bilgileri (opsiyonel)
    plate: '',
    registration: '',
    // Mülk bilgileri (opsiyonel)
    propertyType: '',
    propertyAddress: ''
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

  // TC Kimlik formatlaması
  const formatTCNO = (value: string) => {
    // Sadece rakamları al, maksimum 11 karakter
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    
    // Format: XXX XX XXX XX XX (11 haneli için)
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{1})/, '$1 $2 $3 $4 $5');
    } else if (numbers.length > 8) {
      return numbers.replace(/(\d{3})(\d{2})(\d{3})(\d{1,2})/, '$1 $2 $3 $4');
    } else if (numbers.length > 5) {
      return numbers.replace(/(\d{3})(\d{2})(\d{1,3})/, '$1 $2 $3');
    } else if (numbers.length > 3) {
      return numbers.replace(/(\d{3})(\d{1,2})/, '$1 $2');
    }
    
    return numbers;
  };

  // Telefon numarası validasyonu
  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^05[0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  // TC Kimlik validasyonu (Luhn algoritması)
  const validateTCNO = (tcno: string) => {
    const cleanTCNO = tcno.replace(/\s/g, '');
    
    // 11 haneli olmalı ve sadece rakam
    if (!/^[0-9]{11}$/.test(cleanTCNO)) {
      return { valid: false, message: 'TC Kimlik 11 haneli olmalıdır' };
    }
    
    // İlk hane 0 olamaz
    if (cleanTCNO[0] === '0') {
      return { valid: false, message: 'TC Kimlik ilk hanesi 0 olamaz' };
    }
    
    // Luhn algoritması kontrolü
    const digits = cleanTCNO.split('').map(Number);
    
    // İlk 10 hanenin toplamı
    const sum = digits.slice(0, 10).reduce((acc, digit) => acc + digit, 0);
    
    // 11. hane kontrolü
    if (sum % 10 !== digits[10]) {
      return { valid: false, message: 'Geçersiz TC Kimlik numarası' };
    }
    
    // Çift ve tek hanelerin toplamı kontrolü
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    
    if ((oddSum * 7 - evenSum) % 10 !== digits[9]) {
      return { valid: false, message: 'Geçersiz TC Kimlik numarası' };
    }
    
    return { valid: true, message: '' };
  };

  // Şifre validasyonu
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return { valid: false, message: 'Şifre en az 6 karakter olmalıdır' };
    }
    return { valid: true, message: '' };
  };

  // Telefon numarası mevcut mu kontrol et
  const checkPhoneExists = async (phone: string) => {
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Phone check error:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanPhone = formData.phone.replace(/\s/g, '');
      const cleanTCNO = formData.tcno.replace(/\s/g, '');

      // Telefon numarası kontrolü
      if (!validatePhone(formData.phone)) {
        toast.error('Geçerli bir telefon numarası giriniz! (05XXXXXXXXX)');
        return;
      }

      // Telefon numarası mevcut mu kontrol et
      const phoneExists = await checkPhoneExists(formData.phone);
      if (phoneExists) {
        toast.error('Bu telefon numarası zaten kayıtlı!');
        return;
      }

      // Şifre validasyonu
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        toast.error(passwordValidation.message);
        return;
      }

      // Şifre eşleşme kontrolü
      if (formData.password !== formData.confirmPassword) {
        toast.error('Şifreler eşleşmiyor!');
        return;
      }

      // TC No validasyonu
      if (formData.tcno) {
        const tcValidation = validateTCNO(formData.tcno);
        if (!tcValidation.valid) {
          toast.error(tcValidation.message);
          return;
        }
      }

      console.log('🔄 Kayıt işlemi başlıyor...', {
        phone: cleanPhone
      });

      // Firebase Auth için telefon numarasını email formatına çevir
      const email = `${cleanPhone}@enbalsigorta.local`;
      
      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        formData.password
      );
      
      console.log('✅ Firebase Auth kullanıcısı oluşturuldu:', userCredential.user.uid);

      // Kullanıcı bilgilerini Firestore'a kaydet
      const userData = {
        // Temel bilgiler
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        phone: cleanPhone,
        tcno: cleanTCNO,
        birthdate: formData.birthdate,
        address: formData.address.trim(),
        // Araç bilgileri
        plate: formData.plate.toUpperCase().trim(),
        registration: formData.registration.toUpperCase().trim(),
        // Mülk bilgileri
        propertyType: formData.propertyType,
        propertyAddress: formData.propertyAddress.trim(),
        // Sistem bilgileri
        email: email, // Internal email
        role: 'user',
        createdAt: new Date(),
        browserNotificationsEnabled: false,
        lastLoginDate: new Date(),
        isActive: true
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      console.log('✅ Kullanıcı bilgileri Firestore\'a kaydedildi');
      
      toast.success('🎉 Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      
      // 2 saniye bekleyip login sayfasına yönlendir
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Kayıt hatası:', error);
      
      // Firebase hata kodlarına göre özel mesajlar
      let errorMessage = 'Kayıt başarısız. Lütfen tekrar deneyin.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Bu telefon numarası zaten kayıtlı!';
            break;
          case 'auth/weak-password':
            errorMessage = 'Şifre çok zayıf! En az 6 karakter olmalıdır.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Ağ bağlantısı hatası! İnternet bağlantınızı kontrol edin.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Çok fazla deneme! Lütfen daha sonra tekrar deneyin.';
            break;
          default:
            errorMessage = `Kayıt hatası: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Temel bilgilerin kontrolü
      if (!formData.name.trim()) {
        toast.error('İsim alanı zorunludur!');
        return;
      }
      if (!formData.surname.trim()) {
        toast.error('Soyisim alanı zorunludur!');
        return;
      }
      if (!formData.phone.trim()) {
        toast.error('Telefon numarası zorunludur!');
        return;
      }
      if (!validatePhone(formData.phone)) {
        toast.error('Geçerli bir telefon numarası giriniz! (05XXXXXXXXX)');
        return;
      }
      if (!formData.password) {
        toast.error('Şifre alanı zorunludur!');
        return;
      }
      
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        toast.error(passwordValidation.message);
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast.error('Şifreler eşleşmiyor!');
        return;
      }
      
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Kayıt Ol</h2>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Temel Bilgiler</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">İsim *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Adınız"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Soyisim *</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Soyadınız"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Telefon Numarası *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="05XX XXX XX XX"
                  maxLength={13}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Giriş yaparken bu telefon numarasını kullanacaksınız</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Şifre *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="••••••••"
                    minLength={6}
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
                <p className="text-sm text-gray-500 mt-1">En az 6 karakter olmalıdır</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Şifre Tekrarı *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
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
                type="button"
                onClick={nextStep}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                Devam Et
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Detay Bilgiler</h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-purple-600 hover:text-purple-700"
                >
                  ← Geri
                </button>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">TC Kimlik No *</label>
                <input
                  type="text"
                  value={formData.tcno}
                  onChange={(e) => {
                    const formatted = formatTCNO(e.target.value);
                    setFormData({ ...formData, tcno: formatted });
                    
                    // Real-time TC validation
                    if (formatted.replace(/\s/g, '').length === 11) {
                      const validation = validateTCNO(formatted);
                      if (!validation.valid) {
                        toast.error(validation.message);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="XXX XX XXX XX XX"
                  maxLength={15}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">11 haneli TC kimlik numaranızı giriniz</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Doğum Tarihi *</label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Adres *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Tam adresinizi giriniz"
                  required
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-600 mb-3">Araç Bilgileri (Opsiyonel)</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 mb-2">Araç Plakası</label>
                    <input
                      type="text"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="34ABC123"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Ruhsat Seri No</label>
                    <input
                      type="text"
                      value={formData.registration}
                      onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="AA000000"
                      maxLength={8}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-600 mb-3">Mülk Bilgileri (Opsiyonel)</h4>
                
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Mülk Türü</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Ev">Ev</option>
                    <option value="İşyeri">İşyeri</option>
                    <option value="Arsa">Arsa</option>
                    <option value="Depo">Depo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Mülk Adresi</label>
                  <textarea
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={2}
                    placeholder="Mülk adresi (ikamet adresinden farklıysa)"
                  />
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
                    Kayıt yapılıyor...
                  </>
                ) : (
                  'Kayıt Ol'
                )}
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-600">Zaten hesabınız var mı?</span>
          <Link href="/login" className="text-purple-600 hover:text-purple-700 ml-2">
            Giriş Yap
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-700 text-sm">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}