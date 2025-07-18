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
    hasPushSubscription: false,
    pushSubscriptionSource: undefined as string | undefined
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
      setNotificationStatus({
        ...status,
        pushSubscriptionSource: status.pushSubscriptionSource ?? undefined
      });
    } catch (error) {
      console.error('Notification status update error:', error);
    }
  };

  // ✅ Notification setup fonksiyonu - Enhanced error handling
  const handleNotificationSetup = async () => {
    if (!user) {
      toast.error('Kullanıcı bilgileri yüklenemedi!');
      return;
    }

    try {
      setSaving(true);
      console.log('🔔 Setting up notifications for user:', user.uid);
      
      const manager = SimpleBrowserNotifications.getInstance();
      
      // Step-by-step setup with detailed logging
      console.log('Step 1: Starting notification setup...');
      const success = await manager.setupForUser(user.uid);
      
      console.log('Step 2: Setup result:', success);
      
      if (success) {
        updateNotificationStatus();
        const status = manager.getStatus();
        
        console.log('Step 3: Final status:', status);
        
        let message = 'Bildirimler başarıyla aktif edildi!';
        if (status.hasServiceWorker) {
          message += ' Service Worker aktif.';
        }
        if (status.hasPushSubscription) {
          if (status.pushSubscriptionSource === 'client-side-fallback') {
            message += ' Push notification fallback mode\'da aktif.';
          } else {
            message += ' Push notification destekleniyor.';
          }
        } else {
          message += ' (Sadece browser notification aktif)';
        }
        
        toast.success(message);
      } else {
        console.error('❌ Notification setup failed');
        toast.error('Bildirim kurulumu başarısız!');
      }
    } catch (error: any) {
      console.error('❌ Notification setup error:', {
        error: error.message,
        stack: error.stack
      });
      
      // ✅ Enhanced error messages
      let errorMessage = 'Bildirim kurulumu sırasında hata oluştu';
      
      if (error.message.includes('permission denied') || error.message.includes('Permission denied')) {
        errorMessage = 'Tarayıcı izni reddedildi. Lütfen tarayıcı ayarlarından bildirimleri açın.';
      } else if (error.message.includes('Push subscription')) {
        errorMessage = 'Push notification kurulamadı, ama browser notification aktif edildi';
        toast(errorMessage, {
          icon: '⚠️',
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B'
          }
        });
        return; // Don't show error toast for this case
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Ağ bağlantısı hatası. Bildirimler kısmen aktif edildi.';
        toast(errorMessage, {
          icon: '⚠️',
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B'
          }
        });
        return;
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

            {/* ✅ BÜYÜK BİLDİRİM AÇMA/KAPATMA BUTONU - Her zaman görünür */}
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="text-xl font-bold mb-2">
                  {notificationStatus.permission === 'granted' && notificationStatus.isSetup
                    ? 'Bildirimler Aktif!' 
                    : notificationStatus.permission === 'granted' && !notificationStatus.isSetup
                    ? 'Bildirimler Kapalı'
                    : 'Bildirimleri Aç'
                  }
                </h3>
                <p className="text-purple-100">
                  {notificationStatus.permission === 'granted' && notificationStatus.isSetup
                    ? 'Teklif güncellemelerinizi anlık olarak alıyorsunuz'
                    : notificationStatus.permission === 'granted' && !notificationStatus.isSetup
                    ? 'Bildirimleri tekrar aktif edebilirsiniz'
                    : 'Teklif güncellemelerinizi kaçırmayın! Bildirimleri aktif edin.'
                  }
                </p>
              </div>

              {/* ✅ Durum bazlı butonlar */}
              {notificationStatus.permission === 'granted' && notificationStatus.isSetup ? (
                // BİLDİRİMLER AKTİF - Test ve Kapat seçenekleri
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      const manager = SimpleBrowserNotifications.getInstance();
                      manager.showTestNotification();
                    }}
                    className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test Bildirimi
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (confirm('Bildirimleri geçici olarak kapatmak istediğinizden emin misiniz? (Tekrar açabilirsiniz)')) {
                        try {
                          if (user) {
                            await disableNotifications(user.uid);
                            updateNotificationStatus();
                            toast.success('Bildirimler kapatıldı! İstediğiniz zaman tekrar açabilirsiniz.');
                          }
                        } catch (error) {
                          toast.error('Bildirimler kapatılırken hata oluştu!');
                        }
                      }
                    }}
                    className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                    Geçici Kapat
                  </button>
                </div>
              ) : notificationStatus.permission === 'granted' && !notificationStatus.isSetup ? (
                // İZİN VAR AMA KAPALI - Tekrar Aç butonu
                <button
                  onClick={handleNotificationSetup}
                  disabled={saving}
                  className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                      Açılıyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Bildirimleri Tekrar Aç
                    </>
                  )}
                </button>
              ) : (
                // İLK KEZ AÇMA - Normal setup butonu
                <button
                  onClick={handleNotificationSetup}
                  disabled={saving || notificationStatus.permission === 'denied'}
                  className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                      Kuruluyor...
                    </>
                  ) : notificationStatus.permission === 'denied' ? (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      İzin Reddedildi
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Bildirimleri Aktif Et
                    </>
                  )}
                </button>
              )}

              {/* ✅ Kapalıysa hızlı açma bilgisi */}
              {notificationStatus.permission === 'granted' && !notificationStatus.isSetup && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
                  <p className="text-sm">
                    <strong>✅ İyi haber!</strong> Tarayıcı izniniz mevcut. Tek tıkla tekrar açabilirsiniz!
                  </p>
                </div>
              )}

              {/* ✅ İzin reddedilmişse tarayıcı ayarları rehberi */}
              {notificationStatus.permission === 'denied' && (
                <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                  <p className="text-sm">
                    <strong>⚠️ Bildirim izni reddedildi.</strong> Bildirimleri açmak için:
                    <br />• Tarayıcınızın adres çubuğundaki 🔒 simgesine tıklayın
                    <br />• "Bildirimler" seçeneğini "İzin ver" olarak değiştirin
                    <br />• Sayfayı yenileyin ve tekrar deneyin
                  </p>
                </div>
              )}
            </div>
            
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
                        notificationStatus.permission === 'granted' ? 'İzin verildi ✅' :
                        notificationStatus.permission === 'denied' ? 'İzin reddedildi ❌' :
                        notificationStatus.permission === 'unsupported' ? 'Desteklenmiyor ❌' :
                        'İzin bekleniyor ⏳'
                      }
                    </p>
                  </div>
                </div>
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
                        ? 'Tarayıcı kapalı olsa bile bildirim alabilirsiniz ✅'
                        : 'Sadece tarayıcı açıkken bildirim alabilirsiniz ⏳'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Push Subscription Status - Enhanced */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    notificationStatus.hasPushSubscription ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">Push Notification</p>
                    <p className="text-sm text-gray-600">
                      {notificationStatus.hasPushSubscription ? (
                        <>
                          Sunucu bildirim gönderebilir ✅
                          {notificationStatus.pushSubscriptionSource === 'client-side-fallback' && (
                            <span className="text-blue-600"> (Fallback mode)</span>
                          )}
                        </>
                      ) : (
                        'Sadece tarayıcı bildirimleri aktif ⏳'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* İstatistikler */}
              {notificationStatus.isSetup && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium text-gray-800">Bildirim İstatistikleri</p>
                      <p className="text-sm text-gray-600">
                        {notificationStatus.shownCount} bildirim gösterildi
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Info */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-blue-800 font-medium text-sm">Gelişmiş Bildirim Sistemi</p>
                    <p className="text-blue-700 text-sm mt-1">
                      • 🖥️ Masaüstü ve 📱 mobil cihazlarda çalışır<br/>
                      • 🔄 Tarayıcı kapalı olsa bile bildirim alabilirsiniz<br/>
                      • 🔊 Sesli bildirim ve titreşim desteği<br/>
                      • ⚡ Teklif güncellemeleri anlık olarak size ulaşır<br/>
                      • 🛡️ Güvenli ve gizli - sadece size özel<br/>
                      {notificationStatus.pushSubscriptionSource === 'client-side-fallback' && (
                        <span className="text-amber-700">
                          • ⚙️ Fallback mode aktif - sistem otomatik iyileştirme yaptı
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
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