'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface LiveSupportProps {
  onClose: () => void;
  initialType?: string;
}

export default function LiveSupport({ onClose, initialType = '' }: LiveSupportProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [useMyInfo, setUseMyInfo] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userLoginStatus, setUserLoginStatus] = useState<'checking' | 'logged-in' | 'not-logged-in'>('checking');
  const [formData, setFormData] = useState({
    insuranceType: initialType,
    // Kişi bilgileri
    name: '',
    phone: '',
    tcno: '',
    birthdate: '',
    // Araç bilgileri
    plate: '',
    registration: '',
    // Mülk bilgileri
    propertyType: '',
    address: ''
  });

  // ✅ Kullanıcı durumu kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ ...userData, uid: authUser.uid });
          setUserLoginStatus('logged-in');
        }
      } else {
        setUser(null);
        setUserLoginStatus('not-logged-in');
        // Kullanıcı giriş yapmamışsa modal göster
        setShowLoginModal(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Kayıt olmadan devam et
  const handleContinueWithoutLogin = () => {
    setShowLoginModal(false);
    setUserLoginStatus('not-logged-in');
    toast('📞 Kayıt olmadan devam ediyorsunuz. Teklif cevabınız telefonunuza bildirilecektir.', {
      icon: 'ℹ️',
      duration: 4000,
    });
  };

  // ✅ Kayıt olmaya yönlendir
  const handleGoToRegister = () => {
    router.push('/register');
    onClose();
  };

  const fillMyInfo = () => {
    if (user && useMyInfo) {
      setFormData({
        ...formData,
        name: `${user.name} ${user.surname}`,
        phone: user.phone,
        tcno: user.tcno,
        birthdate: user.birthdate,
        plate: user.plate || '',
        registration: user.registration || '',
        propertyType: user.propertyType || '',
        address: user.address || user.propertyAddress || ''
      });
    } else {
      setFormData({
        ...formData,
        name: '',
        phone: '',
        tcno: '',
        birthdate: '',
        plate: '',
        registration: '',
        propertyType: '',
        address: ''
      });
    }
  };

  useEffect(() => {
    fillMyInfo();
  }, [useMyInfo, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Teklif talebini Firestore'a kaydet
      const quoteData = {
        ...formData,
        userId: user?.uid || null,
        userName: user ? `${user.name} ${user.surname}` : 'Misafir',
        userStatus: user ? 'registered' : 'guest',
        status: 'pending',
        createdAt: serverTimestamp(),
        isForSelf: useMyInfo,
        adminResponse: null,
        price: null,
        adminNotes: ''
      };

      await addDoc(collection(db, 'quotes'), quoteData);

      // Admin bildirim API'sine çağrı
      await fetch('/api/admin-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_quote',
          insuranceType: formData.insuranceType,
          customerName: formData.name,
          customerPhone: formData.phone
        }),
      });

      if (user) {
        toast.success('✅ Teklif talebiniz alındı! Cevap geldiğinde bildirim alacaksınız.');
      } else {
        toast.success('📞 Teklif talebiniz alındı! En kısa sürede telefonunuzu arayacağız.');
      }
      
      onClose();
    } catch (error) {
      console.error('Teklif gönderim hatası:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const showVehicleFields = formData.insuranceType === 'Trafik' || formData.insuranceType === 'Kasko';
  const showPropertyFields = !showVehicleFields && formData.insuranceType !== '';

  // ✅ Kullanıcı durumu kontrol modalı
  if (showLoginModal && userLoginStatus === 'not-logged-in') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Daha İyi Hizmet İçin Kayıt Olun</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="text-blue-800">
                <p className="font-semibold mb-3">🎯 Kayıt olmanız durumunda:</p>
                <ul className="text-left space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Teklif cevabını <strong>anında bildirim</strong> olarak alabilirsiniz</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Onaylamanız durumunda <strong>poliçenizi online</strong> alabilirsiniz</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Tüm <strong>geçmiş tekliflerinizi</strong> takip edebilirsiniz</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Belgelerinizi <strong>dijital olarak</strong> indirebilirsiniz</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Kişisel bilgileriniz <strong>otomatik doldurulur</strong></span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-gray-600">Kayıt olmak ister misiniz?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToRegister}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              ✅ Evet, Kayıt Olarak Devam Edeceğim
            </button>
            
            <button
              onClick={handleContinueWithoutLogin}
              className="w-full bg-gray-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              📞 Hayır, Kayıt Olmadan Devam Edeceğim
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 px-6 rounded-lg hover:bg-gray-100 transition"
            >
              İptal
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-yellow-800 font-medium text-sm">Not:</p>
                <p className="text-yellow-700 text-sm">
                  Kayıt olmadan devam ederseniz, teklif cevabı telefon ile bildirilecektir. 
                  Online işlemler için kayıt olmanız gerekmektedir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Kullanıcı durumu kontrol ediliyorsa loading göster
  if (userLoginStatus === 'checking') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Kullanıcı durumu kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {user ? 'Canlı Destek - Teklif Al' : 'Misafir Teklif Talebi'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ✅ Misafir kullanıcı için uyarı */}
        {!user && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-orange-800 font-medium text-sm">📞 Misafir Kullanıcı</p>
                <p className="text-orange-700 text-sm mt-1">
                  Kayıt olmadığınız için teklif cevabı telefon ile bildirilecektir. 
                  Online işlemler için kayıt olmanızı öneririz.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Sigorta Türü</label>
            <select 
              value={formData.insuranceType}
              onChange={(e) => setFormData({...formData, insuranceType: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
              required
            >
              <option value="">Seçiniz</option>
              <option value="Trafik">Trafik Sigortası</option>
              <option value="Kasko">Kasko Sigortası</option>
              <option value="Konut">Konut Sigortası</option>
              <option value="DASK">DASK</option>
              <option value="Yangın">Yangın Sigortası</option>
              <option value="Nakliye">Nakliye Sigortası</option>
            </select>
          </div>

          {user && (
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useMyInfo}
                  onChange={(e) => setUseMyInfo(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Kendi bilgilerimi kullan</span>
              </label>
            </div>
          )}
          
          {formData.insuranceType && (
            <>
              <div className="mb-4">
                <div className="flex items-center">
                  <label className="block text-gray-700 mb-2 flex-1">İsim Soyisim</label>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, name: `${user.name} ${user.surname}`})}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profilden Al
                    </button>
                  )}
                </div>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                  placeholder="Ad Soyad" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <label className="block text-gray-700 mb-2 flex-1">Telefon Numarası</label>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, phone: user.phone})}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Profilden Al
                    </button>
                  )}
                </div>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                  placeholder="05XX XXX XX XX" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <label className="block text-gray-700 mb-2 flex-1">Kimlik Numarası</label>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, tcno: user.tcno})}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      Profilden Al
                    </button>
                  )}
                </div>
                <input 
                  type="text" 
                  value={formData.tcno}
                  onChange={(e) => setFormData({...formData, tcno: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                  placeholder="XXXXXXXXXXX" 
                  maxLength={11} 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <label className="block text-gray-700 mb-2 flex-1">Doğum Tarihi</label>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, birthdate: user.birthdate})}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 012 2z" />
                      </svg>
                      Profilden Al
                    </button>
                  )}
                </div>
                <input 
                  type="date" 
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                  required 
                />
              </div>
              
              {showVehicleFields && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center">
                      <label className="block text-gray-700 mb-2 flex-1">Araç Plakası</label>
                      {user && user.plate && (
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, plate: user.plate})}
                          className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Profilden Al
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={formData.plate}
                      onChange={(e) => setFormData({...formData, plate: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      placeholder="34ABC123" 
                      required 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center">
                      <label className="block text-gray-700 mb-2 flex-1">Ruhsat Seri No</label>
                      {user && user.registration && (
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, registration: user.registration})}
                          className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Profilden Al
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={formData.registration}
                      onChange={(e) => setFormData({...formData, registration: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      placeholder="AA000000" 
                      required 
                    />
                  </div>
                </>
              )}
              
              {showPropertyFields && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center">
                      <label className="block text-gray-700 mb-2 flex-1">Mülk Türü</label>
                      {user && user.propertyType && (
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, propertyType: user.propertyType})}
                          className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          Profilden Al
                        </button>
                      )}
                    </div>
                    <select 
                      value={formData.propertyType}
                      onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      required
                    >
                      <option value="">Seçiniz</option>
                      <option value="Ev">Ev</option>
                      <option value="İşyeri">İşyeri</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center">
                      <label className="block text-gray-700 mb-2 flex-1">Adres</label>
                      {user && (user.address || user.propertyAddress) && (
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, address: user.address || user.propertyAddress})}
                          className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Profilden Al
                        </button>
                      )}
                    </div>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      rows={3} 
                      placeholder="Tam adresinizi giriniz" 
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Gönderiliyor...' : user ? 'Teklif İste' : 'Misafir Teklif İste (Telefon ile Bildirim)'}
          </button>
        </form>
      </div>
    </div>
  );
}