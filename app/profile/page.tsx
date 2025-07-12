'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { setupFCM, sendTestNotification } from '@/lib/fcm';
import toast from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fcmEnabled, setFcmEnabled] = useState(false);
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
          
          // FCM durumu kontrol et
          setFcmEnabled(!!userData.fcmToken);
          
          // FCM setup (otomatik)
          if (userData.fcmToken || Notification.permission === 'granted') {
            setupFCMForUser(authUser.uid);
          }
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const setupFCMForUser = async (userId: string) => {
    try {
      const token = await setupFCM(userId);
      if (token) {
        setFcmEnabled(true);
        toast.success('Push bildirimleri aktif edildi!');
      }
    } catch (error) {
      console.error('FCM setup error:', error);
    }
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
      const token = await setupFCM(user.uid);
      if (token) {
        setFcmEnabled(true);
        toast.success('Push bildirimleri aktif edildi!');
      } else {
        toast.error('Bildirim izni verilmedi!');
      }
    } catch (error) {
      toast.error('Bildirim aktif edilemedi!');
      console.error(error);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;
    
    try {
      const result = await sendTestNotification(user.uid);
      if (result?.success) {
        toast.success('Test bildirimi gönderildi!');
      } else {
        toast.error('Test bildirimi gönderilemedi!');
      }
    } catch (error) {
      toast.error('Test bildirimi hatası!');
      console.error(error);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: null,
        fcmTokenUpdated: new Date()
      });
      setFcmEnabled(false);
      toast.success('Push bildirimleri kapatıldı!');
    } catch (error) {
      toast.error('Bildirim kapatılamadı!');
      console.error(error);
    }
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

            {/* Bildirim Ayarları */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Push Bildirimleri
              </h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">
                    Teklif durumunuz ve önemli güncellemeler hakkında anlık bildirim alın
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Durum: {fcmEnabled ? (
                      <span className="text-green-600 font-medium">✅ Aktif</span>
                    ) : (
                      <span className="text-red-600 font-medium">❌ Pasif</span>
                    )}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  {!fcmEnabled ? (
                    <button
                      onClick={handleEnableNotifications}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      Aktif Et
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleTestNotification}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        Test Et
                      </button>
                      <button
                        onClick={handleDisableNotifications}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Kapat
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              {/* Kişisel Bilgiler */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Kişisel Bilgiler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">İsim</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Soyisim</label>
                    <input
                      type="text"
                      value={formData.surname}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

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
}