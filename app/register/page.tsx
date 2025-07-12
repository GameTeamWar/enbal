'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Temel bilgiler
    name: '',
    surname: '',
    phone: '',
    password: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Firebase'de telefon numarasını email formatına çevirerek kullanacağız
      const email = `${formData.phone}@enbalsigorta.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      
      // Kullanıcı bilgilerini Firestore'a kaydet
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        // Temel bilgiler
        name: formData.name,
        surname: formData.surname,
        phone: formData.phone,
        tcno: formData.tcno,
        birthdate: formData.birthdate,
        address: formData.address,
        // Araç bilgileri
        plate: formData.plate,
        registration: formData.registration,
        // Mülk bilgileri
        propertyType: formData.propertyType,
        propertyAddress: formData.propertyAddress,
        // Sistem bilgileri
        role: 'user',
        createdAt: new Date(),
        notifications: true // Bildirimler aktif
      });
      
      toast.success('Kayıt başarılı!');
      router.push('/login');
    } catch (error) {
      toast.error('Kayıt başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Temel bilgilerin kontrolü
      if (!formData.name || !formData.surname || !formData.phone || !formData.password) {
        toast.error('Lütfen tüm alanları doldurun');
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

              <div>
                <label className="block text-gray-700 mb-2">Telefon Numarası *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Şifre *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="••••••••"
                  required
                />
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
                  onChange={(e) => setFormData({ ...formData, tcno: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="XXXXXXXXXXX"
                  maxLength={11}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Doğum Tarihi *</label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
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
                
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Araç Plakası</label>
                  <input
                    type="text"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="34ABC123"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Ruhsat Seri No</label>
                  <input
                    type="text"
                    value={formData.registration}
                    onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="AA000000"
                  />
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
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Mülk Adresi</label>
                  <textarea
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={2}
                    placeholder="Mülk adresi (farklıysa)"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
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