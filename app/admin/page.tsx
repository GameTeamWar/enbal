'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, onSnapshot, orderBy, addDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('quotes');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [responseData, setResponseData] = useState({
    adminResponse: '',
    price: '',
    adminNotes: ''
  });
  const [userFormData, setUserFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    password: '',
    tcno: '',
    birthdate: '',
    address: '',
    plate: '',
    registration: '',
    propertyType: '',
    propertyAddress: '',
    role: 'user'
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showCardInfoModal, setShowCardInfoModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCardQuote, setSelectedCardQuote] = useState<any>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [newQuotesCount, setNewQuotesCount] = useState(0);
  const [paidQuotesCount, setPaidQuotesCount] = useState(0);
  const [showCardDetails, setShowCardDetails] = useState(false);

  const notificationSound = typeof Audio !== 'undefined' ? new Audio('/notification-sound.mp3') : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          fetchUsers();
          setupQuotesListener();
        } else {
          router.push('/');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const setupQuotesListener = () => {
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const quotesData: any[] = [];
      let pendingCount = 0;
      let paidCount = 0;
      
      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as { 
          id: string; 
          status?: string; 
          customerStatus?: string; 
          awaitingProcessing?: boolean;
        };
        quotesData.push(data);
        
        if (data.status === 'pending') {
          pendingCount++;
        }
        
        if (data.customerStatus === 'card_submitted' && data.awaitingProcessing) {
          paidCount++;
        }
      });
      
      // Yeni teklif kontrolü ve sesli bildirim
      if (quotes.length > 0 && quotesData.length > quotes.length) {
        const newQuote = quotesData[0];
        if (newQuote.status === 'pending' && audioEnabled && notificationSound) {
          playNotificationSound();
          showBrowserNotification(newQuote);
        }
      }
      
      setQuotes(quotesData);
      setNewQuotesCount(pendingCount);
      setPaidQuotesCount(paidCount);
    });

    return unsubscribe;
  };

  const playNotificationSound = () => {
    if (notificationSound) {
      notificationSound.play().catch(e => console.log('Ses çalınamadı:', e));
    }
  };

  const showBrowserNotification = (quote: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Yeni Teklif Talebi!', {
        body: `${quote.insuranceType} - ${quote.name}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchUsers = async () => {
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    const usersData: any[] = [];
    querySnapshot.forEach((doc) => {
      usersData.push({ id: doc.id, ...doc.data() });
    });
    setUsers(usersData);
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('Kullanıcı silindi!');
      fetchUsers();
    }
  };

  const handleQuoteResponse = (quote: any) => {
    setSelectedQuote(quote);
    setResponseData({
      adminResponse: quote.adminResponse || '',
      price: quote.price || '',
      adminNotes: quote.adminNotes || ''
    });
    setShowResponseModal(true);
  };

  const handleDocumentUpload = (quote: any) => {
    setSelectedQuote(quote);
    setShowUploadModal(true);
  };

  const handleCardInfo = (quote: any) => {
    setSelectedCardQuote(quote);
    setShowCardInfoModal(true);
    setShowCardDetails(false);
  };

  const handleAddUser = () => {
    setUserFormData({
      name: '',
      surname: '',
      phone: '',
      password: '',
      tcno: '',
      birthdate: '',
      address: '',
      plate: '',
      registration: '',
      propertyType: '',
      propertyAddress: '',
      role: 'user'
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name || '',
      surname: user.surname || '',
      phone: user.phone || '',
      password: '',
      tcno: user.tcno || '',
      birthdate: user.birthdate || '',
      address: user.address || '',
      plate: user.plate || '',
      registration: user.registration || '',
      propertyType: user.propertyType || '',
      propertyAddress: user.propertyAddress || '',
      role: user.role || 'user'
    });
    setShowEditUserModal(true);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const email = `${userFormData.phone}@enbalsigorta.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, userFormData.password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userFormData.name,
        surname: userFormData.surname,
        phone: userFormData.phone,
        tcno: userFormData.tcno,
        birthdate: userFormData.birthdate,
        address: userFormData.address,
        plate: userFormData.plate,
        registration: userFormData.registration,
        propertyType: userFormData.propertyType,
        propertyAddress: userFormData.propertyAddress,
        role: userFormData.role,
        createdAt: new Date(),
        notifications: true
      });
      
      toast.success('Kullanıcı başarıyla oluşturuldu!');
      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı oluşturulamadı!');
      console.error(error);
    }
  };

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData = {
        name: userFormData.name,
        surname: userFormData.surname,
        tcno: userFormData.tcno,
        birthdate: userFormData.birthdate,
        address: userFormData.address,
        plate: userFormData.plate,
        registration: userFormData.registration,
        propertyType: userFormData.propertyType,
        propertyAddress: userFormData.propertyAddress,
        role: userFormData.role
      };

      await updateDoc(doc(db, 'users', selectedUser.id), updateData);
      
      toast.success('Kullanıcı bilgileri güncellendi!');
      setShowEditUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı güncellenemedi!');
      console.error(error);
    }
  };

  const sendQuoteResponse = async () => {
    if (!selectedQuote || !responseData.adminResponse) {
      toast.error('Lütfen açıklama giriniz!');
      return;
    }

    try {
      await updateDoc(doc(db, 'quotes', selectedQuote.id), {
        ...responseData,
        status: 'responded',
        responseDate: new Date()
      });

      // Kullanıcıya bildirim gönder
      await sendUserNotification(selectedQuote.userId, {
        type: 'quote_response',
        quoteId: selectedQuote.id,
        insuranceType: selectedQuote.insuranceType,
        message: responseData.adminResponse,
        price: responseData.price
      });

      // Web Push Notification gönder
      await sendWebPushNotification(selectedQuote.userId, {
        title: 'Teklif Cevabı Geldi!',
        body: `${selectedQuote.insuranceType} teklifiniz cevaplandı`,
        icon: '/favicon.ico'
      });

      toast.success('Teklif cevabı gönderildi!');
      setShowResponseModal(false);
      setSelectedQuote(null);
    } catch (error) {
      toast.error('Bir hata oluştu!');
      console.error(error);
    }
  };

  const uploadDocument = async () => {
    if (!uploadFile || !selectedQuote) {
      toast.error('Lütfen dosya seçiniz!');
      return;
    }

    try {
      setUploadProgress(10);
      
      const storageRef = ref(storage, `documents/${selectedQuote.id}/${uploadFile.name}`);
      
      setUploadProgress(50);
      const snapshot = await uploadBytes(storageRef, uploadFile);
      
      setUploadProgress(80);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await updateDoc(doc(db, 'quotes', selectedQuote.id), {
        documentUrl: downloadURL,
        documentName: uploadFile.name,
        awaitingProcessing: false,
        documentUploadDate: new Date(),
        customerStatus: 'completed'
      });

      // Kullanıcıya belge hazır bildirimi gönder
      await sendUserNotification(selectedQuote.userId, {
        type: 'document_ready',
        quoteId: selectedQuote.id,
        insuranceType: selectedQuote.insuranceType,
        message: 'Belgeleriniz hazır! İndirebilirsiniz.'
      });

      // Web Push Notification gönder
      await sendWebPushNotification(selectedQuote.userId, {
        title: 'Belgeleriniz Hazır!',
        body: `${selectedQuote.insuranceType} belgeleriniz indirilebilir`,
        icon: '/favicon.ico'
      });

      setUploadProgress(100);
      toast.success('Belge başarıyla yüklendi!');
      setShowUploadModal(false);
      setSelectedQuote(null);
      setUploadFile(null);
      setUploadProgress(0);
    } catch (error) {
      toast.error('Belge yüklenemedi!');
      console.error(error);
      setUploadProgress(0);
    }
  };

  const rejectQuote = async (quote: any) => {
    const reason = prompt('Red nedeni:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'quotes', quote.id), {
        status: 'rejected',
        rejectionReason: reason,
        responseDate: new Date()
      });

      await sendUserNotification(quote.userId, {
        type: 'quote_rejected',
        quoteId: quote.id,
        insuranceType: quote.insuranceType,
        reason: reason
      });

      // Web Push Notification gönder
      await sendWebPushNotification(quote.userId, {
        title: 'Teklif Reddedildi',
        body: `${quote.insuranceType} teklifiniz reddedildi`,
        icon: '/favicon.ico'
      });

      toast.success('Teklif reddedildi!');
    } catch (error) {
      toast.error('Bir hata oluştu!');
      console.error(error);
    }
  };

  const sendUserNotification = async (userId: string, notificationData: any) => {
    if (!userId) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        ...notificationData,
        read: false,
        createdAt: new Date()
      });

      await fetch('/api/user-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...notificationData
        }),
      });
    } catch (error) {
      console.error('Kullanıcı bildirimi gönderilemedi:', error);
    }
  };

  const sendWebPushNotification = async (userId: string, notificationData: any) => {
    try {
      await fetch('/api/web-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...notificationData
        }),
      });
    } catch (error) {
      console.error('Web push bildirimi gönderilemedi:', error);
    }
  };

  const getStatusBadge = (quote: any) => {
    let status = quote.status;
    let text = '';
    let className = '';

    if (quote.customerStatus === 'card_submitted') {
      if (quote.documentUrl) {
        status = 'completed';
        text = 'Tamamlandı';
        className = 'bg-blue-100 text-blue-800';
      } else {
        status = 'card_received';
        text = 'Kart Bilgileri Alındı';
        className = 'bg-orange-100 text-orange-800';
      }
    } else if (quote.customerStatus === 'rejected') {
      status = 'customer_rejected';
      text = 'Müşteri Reddi';
      className = 'bg-gray-100 text-gray-800';
    } else {
      const statusConfig = {
        pending: { text: 'Beklemede', class: 'bg-yellow-100 text-yellow-800' },
        responded: { text: 'Cevaplandı', class: 'bg-green-100 text-green-800' },
        rejected: { text: 'Reddedildi', class: 'bg-red-100 text-red-800' }
      };
      
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
      text = config.text;
      className = config.class;
    }
    
    return (
      <span className={`px-2 py-1 rounded text-sm ${className}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-800">Admin Paneli</h1>
              <div className="flex space-x-3">
                {newQuotesCount > 0 && (
                  <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{newQuotesCount} yeni teklif</span>
                  </div>
                )}
                {paidQuotesCount > 0 && (
                  <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{paidQuotesCount} kart bilgisi bekliyor</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-lg ${audioEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                title={audioEnabled ? 'Sesli bildirimleri kapat' : 'Sesli bildirimleri aç'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {audioEnabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 9v6a3 3 0 11-6 0V9a3 3 0 116 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>
              
              <Link
                href="/"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Ana Sayfa
              </Link>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex space-x-4 border-b">
              <button
                onClick={() => setActiveTab('quotes')}
                className={`pb-4 px-4 relative ${activeTab === 'quotes' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
              >
                Teklif Talepleri
                {(newQuotesCount + paidQuotesCount) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newQuotesCount + paidQuotesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-4 px-4 ${activeTab === 'users' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
              >
                Kullanıcılar
              </button>
            </div>
          </div>

          {activeTab === 'quotes' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tarih</th>
                    <th className="text-left py-3 px-4">Müşteri</th>
                    <th className="text-left py-3 px-4">Sigorta Türü</th>
                    <th className="text-left py-3 px-4">Telefon</th>
                    <th className="text-left py-3 px-4">TC No</th>
                    <th className="text-left py-3 px-4">Fiyat</th>
                    <th className="text-left py-3 px-4">Durum</th>
                    <th className="text-left py-3 px-4">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className={`border-b ${
                      quote.status === 'pending' ? 'bg-yellow-50' : 
                      quote.customerStatus === 'card_submitted' && quote.awaitingProcessing ? 'bg-orange-50' : ''
                    }`}>
                      <td className="py-3 px-4">
                        {quote.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || 'N/A'}
                      </td>
                      <td className="py-3 px-4">{quote.name || 'Misafir'}</td>
                      <td className="py-3 px-4">{quote.insuranceType}</td>
                      <td className="py-3 px-4">
                        <a href={`tel:${quote.phone}`} className="text-purple-600 hover:text-purple-800">
                          {quote.phone}
                        </a>
                      </td>
                      <td className="py-3 px-4">{quote.tcno || '-'}</td>
                      <td className="py-3 px-4">
                        {quote.price && (
                          <span className="font-semibold text-green-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(quote.price))}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(quote)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {quote.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleQuoteResponse(quote)}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                Cevapla
                              </button>
                              <button
                                onClick={() => rejectQuote(quote)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Reddet
                              </button>
                            </>
                          )}
                          
                          {quote.customerStatus === 'card_submitted' && quote.awaitingProcessing && (
                            <>
                              <button
                                onClick={() => handleCardInfo(quote)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Kart Bilgilerini Gör
                              </button>
                              <button
                                onClick={() => handleDocumentUpload(quote)}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                Belge Yükle
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleQuoteResponse(quote)}
                            className="text-gray-600 hover:text-gray-800 font-medium"
                            title="Detayları Görüntüle"
                          >
                            Detay
                          </button>
                          
                          <button
                            onClick={() => {
                              window.open(`https://wa.me/90${quote.phone.replace(/\D/g, '')}`, '_blank');
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="WhatsApp ile iletişim"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.75"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h2>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition"
                >
                  Yeni Kullanıcı Ekle
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">İsim Soyisim</th>
                      <th className="text-left py-3 px-4">Telefon</th>
                      <th className="text-left py-3 px-4">TC No</th>
                      <th className="text-left py-3 px-4">Rol</th>
                      <th className="text-left py-3 px-4">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-3 px-4">{user.name} {user.surname}</td>
                        <td className="py-3 px-4">{user.phone}</td>
                        <td className="py-3 px-4">{user.tcno || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teklif Detay/Cevaplama Modal */}
      {showResponseModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Teklif Detayları</h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Müşteri Bilgileri */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">Müşteri Bilgileri</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Ad Soyad:</span>
                    <span>{selectedQuote.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Telefon:</span>
                    <span>{selectedQuote.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">TC No:</span>
                    <span>{selectedQuote.tcno || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Doğum Tarihi:</span>
                    <span>{selectedQuote.birthdate || '-'}</span>
                  </div>
                  {selectedQuote.address && (
                    <div className="pt-2 border-t">
                      <span className="font-medium">Adres:</span>
                      <p className="text-gray-600 mt-1">{selectedQuote.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Teklif Bilgileri */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">Teklif Bilgileri</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Sigorta Türü:</span>
                    <span>{selectedQuote.insuranceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Teklif ID:</span>
                    <span>{selectedQuote.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tarih:</span>
                    <span>{selectedQuote.createdAt?.toDate?.()?.toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Durum:</span>
                    <span>{getStatusBadge(selectedQuote)}</span>
                  </div>
                  {selectedQuote.plate && (
                    <div className="flex justify-between">
                      <span className="font-medium">Plaka:</span>
                      <span>{selectedQuote.plate}</span>
                    </div>
                  )}
                  {selectedQuote.registration && (
                    <div className="flex justify-between">
                      <span className="font-medium">Ruhsat:</span>
                      <span>{selectedQuote.registration}</span>
                    </div>
                  )}
                  {selectedQuote.propertyType && (
                    <div className="flex justify-between">
                      <span className="font-medium">Mülk Türü:</span>
                      <span>{selectedQuote.propertyType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Önceki Yanıtlar ve Notlar */}
            {(selectedQuote.adminResponse || selectedQuote.rejectionReason || selectedQuote.customerRejectionReason) && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-3">Geçmiş İşlemler</h4>
                
                {selectedQuote.adminResponse && (
                  <div className="mb-3 p-3 bg-green-100 rounded">
                    <p className="font-medium text-green-800">Admin Cevabı:</p>
                    <p className="text-green-700">{selectedQuote.adminResponse}</p>
                    {selectedQuote.price && (
                      <p className="text-green-600 font-medium mt-1">
                        Fiyat: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(selectedQuote.price))}
                      </p>
                    )}
                    {selectedQuote.responseDate && (
                      <p className="text-green-600 text-sm mt-1">
                        Tarih: {selectedQuote.responseDate?.toDate?.()?.toLocaleString('tr-TR')}
                      </p>
                    )}
                  </div>
                )}

                {selectedQuote.rejectionReason && (
                  <div className="mb-3 p-3 bg-red-100 rounded">
                    <p className="font-medium text-red-800">Admin Red Nedeni:</p>
                    <p className="text-red-700">{selectedQuote.rejectionReason}</p>
                  </div>
                )}

                {selectedQuote.customerRejectionReason && (
                  <div className="mb-3 p-3 bg-gray-100 rounded">
                    <p className="font-medium text-gray-800">Müşteri Red Nedeni:</p>
                    <p className="text-gray-700">{selectedQuote.customerRejectionReason}</p>
                  </div>
                )}

                {selectedQuote.adminNotes && (
                  <div className="p-3 bg-purple-100 rounded">
                    <p className="font-medium text-purple-800">Admin Notları:</p>
                    <p className="text-purple-700">{selectedQuote.adminNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Yeni Yanıt Formu - Sadece pending durumda göster */}
            {selectedQuote.status === 'pending' && (
              <form onSubmit={(e) => { e.preventDefault(); sendQuoteResponse(); }}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Müşteri Açıklaması *</label>
                  <textarea
                    value={responseData.adminResponse}
                    onChange={(e) => setResponseData({...responseData, adminResponse: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={4}
                    placeholder="Müşteriye gönderilecek açıklama..."
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Fiyat Bilgisi (₺)</label>
                  <input
                    type="number"
                    value={responseData.price}
                    onChange={(e) => setResponseData({...responseData, price: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Örn: 1500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Admin Notları (İç Kullanım)</label>
                  <textarea
                    value={responseData.adminNotes}
                    onChange={(e) => setResponseData({...responseData, adminNotes: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={3}
                    placeholder="Sadece admin panelinde görünür notlar..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    Cevabı Gönder
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                  >
                    Kapat
                  </button>
                </div>
              </form>
            )}

            {/* Sadece görüntüleme için kapat butonu */}
            {selectedQuote.status !== 'pending' && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kullanıcı Ekleme Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Yeni Kullanıcı Ekle</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={createUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">İsim *</label>
                  <input
                    type="text"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Soyisim *</label>
                  <input
                    type="text"
                    value={userFormData.surname}
                    onChange={(e) => setUserFormData({...userFormData, surname: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="05XX XXX XX XX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Şifre *</label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">TC No</label>
                  <input
                    type="text"
                    value={userFormData.tcno}
                    onChange={(e) => setUserFormData({...userFormData, tcno: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    maxLength={11}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={userFormData.birthdate}
                    onChange={(e) => setUserFormData({...userFormData, birthdate: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Plaka</label>
                  <input
                    type="text"
                    value={userFormData.plate}
                    onChange={(e) => setUserFormData({...userFormData, plate: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Ruhsat Seri No</label>
                  <input
                    type="text"
                    value={userFormData.registration}
                    onChange={(e) => setUserFormData({...userFormData, registration: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Mülk Türü</label>
                  <select
                    value={userFormData.propertyType}
                    onChange={(e) => setUserFormData({...userFormData, propertyType: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Ev">Ev</option>
                    <option value="İşyeri">İşyeri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Rol</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Adres</label>
                  <textarea
                    value={userFormData.address}
                    onChange={(e) => setUserFormData({...userFormData, address: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Mülk Adresi</label>
                  <textarea
                    value={userFormData.propertyAddress}
                    onChange={(e) => setUserFormData({...userFormData, propertyAddress: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Kullanıcı Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kullanıcı Düzenleme Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Kullanıcı Düzenle</h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={updateUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">İsim *</label>
                  <input
                    type="text"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Soyisim *</label>
                  <input
                    type="text"
                    value={userFormData.surname}
                    onChange={(e) => setUserFormData({...userFormData, surname: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={selectedUser.phone}
                    disabled
                    className="w-full px-4 py-3 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">TC No</label>
                  <input
                    type="text"
                    value={userFormData.tcno}
                    onChange={(e) => setUserFormData({...userFormData, tcno: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    maxLength={11}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={userFormData.birthdate}
                    onChange={(e) => setUserFormData({...userFormData, birthdate: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Plaka</label>
                  <input
                    type="text"
                    value={userFormData.plate}
                    onChange={(e) => setUserFormData({...userFormData, plate: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Ruhsat Seri No</label>
                  <input
                    type="text"
                    value={userFormData.registration}
                    onChange={(e) => setUserFormData({...userFormData, registration: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Mülk Türü</label>
                  <select
                    value={userFormData.propertyType}
                    onChange={(e) => setUserFormData({...userFormData, propertyType: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Ev">Ev</option>
                    <option value="İşyeri">İşyeri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Rol</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Adres</label>
                  <textarea
                    value={userFormData.address}
                    onChange={(e) => setUserFormData({...userFormData, address: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Mülk Adresi</label>
                  <textarea
                    value={userFormData.propertyAddress}
                    onChange={(e) => setUserFormData({...userFormData, propertyAddress: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kart Bilgileri Modal */}
      {showCardInfoModal && selectedCardQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">💳 Kart Bilgileri</h3>
              <button
                onClick={() => setShowCardInfoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Teklif Bilgileri</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Müşteri:</span> {selectedCardQuote.name}</p>
                <p><span className="font-medium">Telefon:</span> {selectedCardQuote.phone}</p>
                <p><span className="font-medium">TC No:</span> {selectedCardQuote.tcno}</p>
                <p><span className="font-medium">Sigorta:</span> {selectedCardQuote.insuranceType}</p>
                <p><span className="font-medium">Teklif ID:</span> {selectedCardQuote.id}</p>
                {selectedCardQuote.price && (
                  <p><span className="font-medium">Tutar:</span> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(selectedCardQuote.price))}</p>
                )}
              </div>
            </div>

            {selectedCardQuote.paymentInfo && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border">
                <h4 className="font-semibold text-green-800 mb-3">💳 Kart Bilgileri</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Kart Numarası:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-gray-800">
                        {showCardDetails ? selectedCardQuote.paymentInfo.originalCardNumber || selectedCardQuote.paymentInfo.cardNumber : '****-****-****-' + (selectedCardQuote.paymentInfo.originalCardNumber || selectedCardQuote.paymentInfo.cardNumber).slice(-4)}
                      </span>
                      {!selectedCardQuote.documentUrl && (
                        <button
                          onClick={() => setShowCardDetails(!showCardDetails)}
                          className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded"
                        >
                          {showCardDetails ? 'Gizle' : 'Göster'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Kart Sahibi:</span>
                    <span className="text-gray-800">{selectedCardQuote.paymentInfo.cardHolder}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Son Kullanma:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-gray-800">
                        {showCardDetails ? selectedCardQuote.paymentInfo.expiryDate : '**/**'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">CVV:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-gray-800">
                        {showCardDetails ? selectedCardQuote.paymentInfo.originalCvv || selectedCardQuote.paymentInfo.cvv : '***'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Taksit:</span>
                    <span className="text-gray-800">
                      {selectedCardQuote.paymentInfo.installments === '1' ? 'Tek Çekim' : selectedCardQuote.paymentInfo.installments + ' Taksit'}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="font-medium text-gray-600">Gönderim Tarihi:</span>
                    <span className="text-gray-800 ml-2">
                      {selectedCardQuote.customerResponseDate?.toDate?.()?.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-yellow-800 font-medium">Bu bilgilerle ödemeyi yapın</p>
                  <p className="text-yellow-700 text-sm mt-1">Ödeme yaptıktan sonra belgeleri sisteme yükleyin. Müşteri 30 dakika bekleme süresinde.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowCardInfoModal(false);
                  handleDocumentUpload(selectedCardQuote);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                Ödeme Yaptım, Belge Yükle
              </button>
              <button
                onClick={() => setShowCardInfoModal(false)}
                className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Belge Yükleme Modal */}
      {showUploadModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Belge Yükle</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Teklif Bilgileri</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Müşteri:</span> {selectedQuote.name}</p>
                <p><span className="font-medium">Sigorta:</span> {selectedQuote.insuranceType}</p>
                <p><span className="font-medium">Teklif ID:</span> {selectedQuote.id}</p>
                {selectedQuote.price && (
                  <p><span className="font-medium">Ödenen Tutar:</span> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(selectedQuote.price))}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Belge Dosyası (PDF, DOC, DOCX) *</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
              {uploadFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Seçilen dosya: {uploadFile.name}
                </div>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Yükleniyor... {uploadProgress}%</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={uploadDocument}
                disabled={!uploadFile || uploadProgress > 0}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {uploadProgress > 0 ? 'Yükleniyor...' : 'Belgeyi Yükle'}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadProgress(0);
                }}
                className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}