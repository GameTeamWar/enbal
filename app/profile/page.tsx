'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { 
  setupSimpleNotifications, 
  showTestNotification, 
  disableNotifications, 
  getNotificationStatus 
} from '@/lib/simple-notifications';
import toast from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notificationStatus, setNotificationStatus] = useState<any>({
    permission: 'default',
    isSetup: false,
    isListening: false
  });
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    tcno: '',
    birthdate: '',
    address: '',
    // Araç bilgileri
    plate: '',
    registration: '',
    // Mülk bilgileri
    propertyType: '',
    propertyAddress: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ ...userData, uid: authUser.uid });
          setFormData({
            name: userData.name || '',
            surname: userData.surname || '',
            phone: userData.phone || '',
            tcno: userData.tcno || '',
            birthdate: userData.birthdate || '',
            address: userData.address || '',
            plate: userData.plate || '',
            registration: userData.registration || '',
            propertyType: userData.propertyType || '',
            propertyAddress: userData.propertyAddress || ''
          });
          
          // Notification durumunu kontrol et
          updateNotificationStatus();
          
          // Eğer bildirimler daha önce aktifse, sistemi otomatik başlat
          if (userData.browserNotificationsEnabled) {
            try {
              await setupSimpleNotifications(authUser.uid);
              updateNotificationStatus();
            } catch (error) {
              console.log('Otomatik notification setup başarısız:', error);
            }
          }
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const updateNotificationStatus = () => {
    const status = getNotificationStatus();
    setNotificationStatus(status);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      toast.success('Bilgileriniz güncellendi!');
    } catch (error) {
      toast.error('Güncelleme başarısız!');
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    
    try {
      const success = await setupSimpleNotifications(user.uid);
      if (success) {
        updateNotificationStatus();
        toast.success('🎉 Browser bildirimleri aktif edildi!');
      } else {
        toast.error('Bildirim izni verilmedi!');
      }
    } catch (error) {
      toast.error('Bildirim aktif edilemedi!');
      console.error(error);
    }
  };

  const handleTestNotification = () => {
    try {
      showTestNotification();
      toast.success('Test bildirimi gönderildi!');
    } catch (error) {
      toast.error('Test bildirimi gönderilemedi!');
      console.error(error);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user) return;
    
    try {
      await disableNotifications(user.uid);
      updateNotificationStatus();
      toast.success('Browser bildirimleri kapatıldı!');
    } catch (error) {
      toast.error('Bildirim kapatılamadı!');
      console.error(error);
    }
  };

  const getNotificationStatusText = () => {
    if (notificationStatus.permission === 'unsupported') {
      return '❌ Tarayıcınız bildirim desteklemiyor';
    }
    if (notificationStatus.permission === 'denied') {
      return '🚫 Bildirimler engellenmiş (Tarayıcı ayarlarından açın)';
    }
    if (notificationStatus.permission === 'granted' && notificationStatus.isSetup && notificationStatus.isListening) {
      return '✅ Aktif - Real-time dinleniyor';
    }
    if (notificationStatus.permission === 'granted' && notificationStatus.isSetup) {
      return '⚠️ Aktif ama dinlenmiyor';
    }
    if (notificationStatus.permission === 'granted') {
      return '⏳ İzin verildi, kurulum gerekli';
    }
    return '❌ Pasif';
  };

  const getNotificationStatusColor = () => {
    if (notificationStatus.permission === 'granted' && notificationStatus.isSetup && notificationStatus.isListening) {
      return 'text-green-600';
    }
    if (notificationStatus.permission === 'granted') {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Profilim</h1>
            </div>

            {/* Bildirim Ayarları - Gelişmiş Versiyon */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-100">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Browser Bildirimleri (Gelişmiş Sistem)
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">
                    Teklif durumunuz hakkında anlık browser bildirimleri alın. 
                    Real-time sistem ile hemen haberdar olun!
                  </p>
                  <p className={`text-sm font-medium mt-2 ${getNotificationStatusColor()}`}>
                    Durum: {getNotificationStatusText()}
                  </p>
                </div>

                {/* Bildirim Detay Durumu */}
                <div className="bg-white bg-opacity-50 rounded-lg p-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Permission:</span> 
                      <span className={`ml-1 ${
                        notificationStatus.permission === 'granted' ? 'text-green-600' : 
                        notificationStatus.permission === 'denied' ? 'text-red-600' : 
                        'text-yellow-600'
                      }`}>
                        {notificationStatus.permission}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Setup:</span> 
                      <span className={`ml-1 ${notificationStatus.isSetup ? 'text-green-600' : 'text-red-600'}`}>
                        {notificationStatus.isSetup ? 'Evet' : 'Hayır'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Dinleme:</span> 
                      <span className={`ml-1 ${notificationStatus.isListening ? 'text-green-600' : 'text-red-600'}`}>
                        {notificationStatus.isListening ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Tarayıcı:</span> 
                      <span className={`ml-1 ${notificationStatus.permission !== 'unsupported' ? 'text-green-600' : 'text-red-600'}`}>
                        {notificationStatus.permission !== 'unsupported' ? 'Destekliyor' : 'Desteklemiyor'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    {!notificationStatus.isSetup || !notificationStatus.isListening ? (
                      <button
                        onClick={handleEnableNotifications}
                        disabled={notificationStatus.permission === 'unsupported'}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Aktif Et</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleTestNotification}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <span>Test Et</span>
                        </button>
                        <button
                          onClick={handleDisableNotifications}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                          <span>Kapat</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Durumu yenile butonu */}
                  <button
                    onClick={updateNotificationStatus}
                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                    title="Durumu Yenile"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Tarayıcı uyarısı */}
                {notificationStatus.permission === 'denied' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-yellow-800 font-medium">Bildirimler Engellenmiş</p>
                        <p className="text-yellow-700 mt-1">
                          Tarayıcınızın adres çubuğundaki bildirim simgesini tıklayarak 
                          "Bildirimlere İzin Ver" seçeneğini aktif edin.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              {/* Kişisel Bilgiler */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Kişisel Bilgiler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">TC Kimlik No</label>
                    <input
                      type="text"
                      value={formData.tcno}
                      onChange={(e) => setFormData({ ...formData, tcno: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      maxLength={11}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Doğum Tarihi</label>
                    <input
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Adres</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      rows={3}
                      placeholder="Tam adresinizi giriniz"
                    />
                  </div>
                </div>
              </div>

              {/* Araç Bilgileri */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Araç Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
              </div>

              {/* Mülk Bilgileri */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Mülk Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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

                  <div className="md:col-span-1">
                    <label className="block text-gray-700 mb-2">Mülk Adresi</label>
                    <textarea
                      value={formData.propertyAddress}
                      onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      rows={3}
                      placeholder="Mülk adresi (farklıysa)"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Bilgileri Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );