'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';
import { setupSimpleNotifications, disableNotifications, SimpleBrowserNotifications } from '@/lib/simple-notifications';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notificationStatus, setNotificationStatus] = useState({
    permission: 'default' as NotificationPermission | 'unsupported',
    isSetup: false,
    isListening: false,
    shownCount: 0,
    hasServiceWorker: false,
    hasPushSubscription: false
  });

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    tcno: '',
    birthdate: '',
    address: '',
    plate: '',
    registration: '',
    propertyType: '',
    propertyAddress: ''
  });

  // ✅ Auth listener - sadece bir kez çalışır
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          console.log('👤 User authenticated:', authUser.uid);
          
          // Kullanıcı verilerini Firestore'dan al
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userInfo = {
              uid: authUser.uid,
              email: authUser.email,
              ...userData
            };
            
            setUser(userInfo);
            
            // Form verilerini doldur
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
                console.log('🔄 Auto-starting notifications...');
                await setupSimpleNotifications(authUser.uid);
                updateNotificationStatus();
              } catch (error) {
                console.log('⚠️ Otomatik notification setup başarısız:', error);
              }
            }
          } else {
            console.log('❌ User document not found');
            toast.error('Kullanıcı bilgileri bulunamadı!');
            router.push('/login');
          }
        } else {
          console.log('❌ User not authenticated');
          router.push('/login');
        }
      } catch (error) {
        console.error('❌ Auth error:', error);
        toast.error('Kimlik doğrulama hatası!');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // ✅ Boş dependency array - sadece mount'ta çalışır

  // ✅ Notification status güncelleme fonksiyonu
  const updateNotificationStatus = () => {
    try {
      const manager = SimpleBrowserNotifications.getInstance();
      const status = manager.getStatus();
      setNotificationStatus(status);
    } catch (error) {
      console.error('Notification status update error:', error);
    }
  };

  // ✅ Notification setup fonksiyonu
  const handleNotificationSetup = async () => {
    if (!user) {
      toast.error('Kullanıcı bilgileri yüklenemedi!');
      return;
    }

    try {
      setSaving(true);
      console.log('🔔 Setting up notifications for user:', user.uid);
      
      const manager = SimpleBrowserNotifications.getInstance();
      const success = await manager.setupForUser(user.uid);
      
      if (success) {
        updateNotificationStatus();
        const status = manager.getStatus();
        
        console.log('📊 Notification status after setup:', status);
        
        let message = 'Bildirimler başarıyla aktif edildi!';
        if (status.hasPushSubscription) {
          message += ' Artık tarayıcı kapalı olsa bile bildirim alabileceksiniz.';
        } else if (status.hasServiceWorker) {
          message += ' Tarayıcı açıkken bildirimler çalışacak.';
        }
        
        toast.success(message);
      } else {
        toast.error('Bildirim kurulumu başarısız!');
      }
    } catch (error: any) {
      console.error('❌ Notification setup error:', {
        error: error.message,
        stack: error.stack,
        userId: user.uid
      });
      
      // Hata mesajını daha detaylı göster
      let errorMessage = 'Bildirim kurulumu sırasında hata oluştu';
      
      if (error.message.includes('permission')) {
        errorMessage = 'Bildirim izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.';
      } else if (error.message.includes('subscription') || error.message.includes('Push')) {
        errorMessage = 'Gelişmiş bildirimler ayarlanamadı, ancak temel bildirimler çalışacak.';
        // Bu durumda toast.warning kullan, error değil
        toast.warning(errorMessage);
        updateNotificationStatus(); // Status'u yine de güncelle
        return;
      } else if (error.message.includes('404') || error.message.includes('Kullanıcı bulunamadı')) {
        errorMessage = 'Kullanıcı hesabı bulunamadı. Lütfen tekrar giriş yapın.';
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Form submit fonksiyonu
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Kullanıcı bilgileri yüklenemedi!');
      return;
    }

    try {
      setSaving(true);
      
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        surname: formData.surname,
        phone: formData.phone,
        tcno: formData.tcno,
        birthdate: formData.birthdate,
        address: formData.address,
        plate: formData.plate,
        registration: formData.registration,
        propertyType: formData.propertyType,
        propertyAddress: formData.propertyAddress,
        updatedAt: new Date()
      });

      toast.success('Profil bilgileri başarıyla güncellendi!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Profil güncellenirken hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Profil bilgileri yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  // ✅ User not found state
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <p className="text-gray-600">Kullanıcı bilgileri bulunamadı</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Giriş Sayfasına Dön
            </button>
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
          {/* ✅ Enhanced Notification Status */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Bildirim Ayarları
            </h2>
            
            <div className="space-y-4">
              {/* Permission Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    notificationStatus.permission === 'granted' ? 'bg-green-500' :
                    notificationStatus.permission === 'denied' ? 'bg-red-500' :
                    notificationStatus.permission === 'unsupported' ? 'bg-gray-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">Tarayıcı Bildirimleri</p>
                    <p className="text-sm text-gray-600">
                      Durum: {
                        notificationStatus.permission === 'granted' ? 'İzin verildi' :
                        notificationStatus.permission === 'denied' ? 'İzin reddedildi' :
                        notificationStatus.permission === 'unsupported' ? 'Desteklenmiyor' :
                        'İzin bekleniyor'
                      }
                    </p>
                  </div>
                </div>
                
                {notificationStatus.permission === 'granted' && (
                  <div className="text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Service Worker Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    notificationStatus.hasServiceWorker ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">Arka Plan Bildirimleri</p>
                    <p className="text-sm text-gray-600">
                      {notificationStatus.hasServiceWorker 
                        ? 'Tarayıcı kapalı olsa bile bildirim alabilirsiniz'
                        : 'Sadece tarayıcı açıkken bildirim alabilirsiniz'
                      }
                    </p>
                  </div>
                </div>
                
                {notificationStatus.hasServiceWorker && (
                  <div className="text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Push Subscription Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    notificationStatus.hasPushSubscription ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">Push Notification</p>
                    <p className="text-sm text-gray-600">
                      {notificationStatus.hasPushSubscription 
                        ? 'Sunucu bildirim gönderebilir'
                        : 'Sadece tarayıcı bildirimleri aktif'
                      }
                    </p>
                  </div>
                </div>
                
                {notificationStatus.hasPushSubscription && (
                  <div className="text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                {notificationStatus.permission !== 'granted' ? (
                  <button
                    onClick={handleNotificationSetup}
                    disabled={saving || notificationStatus.permission === 'denied'}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Kuruluyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Bildirimleri Aktif Et
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {/* ✅ Eğer bildirimler kapalıysa tekrar açma butonu göster */}
                    {!notificationStatus.isSetup && (
                      <button
                        onClick={handleNotificationSetup}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Açılıyor...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Bildirimleri Tekrar Aç
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* ✅ Bildirimler aktifse test ve kapat butonları */}
                    {notificationStatus.isSetup && (
                      <>
                        <button
                          onClick={() => {
                            const manager = SimpleBrowserNotifications.getInstance();
                            manager.showTestNotification();
                          }}
                          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Test Bildirimi Gönder
                        </button>
                        
                        <button
                          onClick={async () => {
                            try {
                              setSaving(true);
                              if (user) {
                                await disableNotifications(user.uid);
                                updateNotificationStatus();
                                toast.success('Bildirimler kapatıldı!');
                              }
                            } catch (error) {
                              toast.error('Bildirimler kapatılırken hata oluştu!');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                          className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Kapatılıyor...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                              Bildirimleri Kapat
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* ✅ Bildirim durumu açıklaması */}
              {notificationStatus.permission === 'granted' && !notificationStatus.isSetup && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-yellow-800 font-medium text-sm">Bildirimler Kapalı</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Tarayıcı izni verilmiş ancak bildirimler kapatılmış durumda. Teklif güncellemelerini kaçırmamak için bildirimleri tekrar açabilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil Bilgileri
            </h2>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">İsim</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="İsminizi giriniz"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soyisim</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Soyisminizi giriniz"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TC Kimlik No</label>
                  <input
                    type="text"
                    value={formData.tcno}
                    onChange={(e) => setFormData({...formData, tcno: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={11}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Tam adresinizi giriniz"
                />
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

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Profili Güncelle
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}