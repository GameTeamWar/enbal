'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  const [showQuoteDetailModal, setShowQuoteDetailModal] = useState(false);
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
  const [isEditMode, setIsEditMode] = useState(false);

  const notificationSound = typeof Audio !== 'undefined' ? new Audio('/nsound.mp3') : null;

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
      
      setQuotes(quotesData);
      setNewQuotesCount(pendingCount);
      setPaidQuotesCount(paidCount);
    });

    return unsubscribe;
  };

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

  const handleUserEdit = (user: any) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name || '',
      surname: user.surname || '',
      phone: user.phone || '',
      tcno: user.tcno || '',
      birthdate: user.birthdate || '',
      address: user.address || '',
      plate: user.plate || '',
      registration: user.registration || '',
      propertyType: user.propertyType || '',
      propertyAddress: user.propertyAddress || '',
      role: user.role || 'user'
    });
    setIsEditMode(true);
    setShowUserModal(true);
  };

  const handleUserAdd = () => {
    setSelectedUser(null);
    setUserFormData({
      name: '',
      surname: '',
      phone: '',
      tcno: '',
      birthdate: '',
      address: '',
      plate: '',
      registration: '',
      propertyType: '',
      propertyAddress: '',
      role: 'user'
    });
    setIsEditMode(false);
    setShowUserModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditMode && selectedUser) {
        // Kullanıcı güncelleme
        await updateDoc(doc(db, 'users', selectedUser.id), userFormData);
        toast.success('Kullanıcı güncellendi!');
      } else {
        // Yeni kullanıcı ekleme
        if (!userFormData.phone) {
          toast.error('Telefon numarası gerekli!');
          return;
        }
        
        // Firebase Auth'ta kullanıcı oluşturma (telefon ile email formatı)
        const email = `${userFormData.phone}@enbalsigorta.com`;
        const defaultPassword = '123456'; // Varsayılan şifre
        
        // Firestore'a kullanıcı kaydetme
        await addDoc(collection(db, 'users'), {
          ...userFormData,
          createdAt: new Date(),
          notifications: true
        });
        
        toast.success('Kullanıcı eklendi! Varsayılan şifre: 123456');
      }
      
      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('İşlem başarısız!');
      console.error(error);
    }
  };

  const handleQuoteDetail = (quote: any) => {
    setSelectedQuote(quote);
    setShowQuoteDetailModal(true);
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

      await sendUserNotification(selectedQuote.userId, {
        type: 'document_ready',
        quoteId: selectedQuote.id,
        insuranceType: selectedQuote.insuranceType,
        message: 'Belgeleriniz hazır! İndirebilirsiniz.'
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

      // Web Push Notification gönder
      await sendWebPushNotification(notificationData);

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

  const sendWebPushNotification = async (data: any) => {
    try {
      await fetch('/api/web-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.type === 'quote_response' ? 'Teklif Cevabı Geldi!' : 
                 data.type === 'quote_rejected' ? 'Teklif Reddedildi' :
                 data.type === 'document_ready' ? 'Belgeleriniz Hazır!' : 'Bildirim',
          body: `${data.insuranceType} sigortası için güncelleme`,
          userId: data.userId
        }),
      });
    } catch (error) {
      console.error('Web push notification gönderilemedi:', error);
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
                          <button
                            onClick={() => handleQuoteDetail(quote)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            title="Detayları Gör"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
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
                  onClick={handleUserAdd}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  + Kullanıcı Ekle
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
                              onClick={() => handleUserEdit(user)}
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

      {/* Teklif Detay Modal */}
      {showQuoteDetailModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Teklif Detayları</h3>
              <button
                onClick={() => setShowQuoteDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temel Bilgiler */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Temel Bilgiler</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Teklif ID:</span> {selectedQuote.id}</div>
                  <div><span className="font-medium">Müşteri:</span> {selectedQuote.name}</div>
                  <div><span className="font-medium">Telefon:</span> {selectedQuote.phone}</div>
                  <div><span className="font-medium">TC No:</span> {selectedQuote.tcno || '-'}</div>
                  <div><span className="font-medium">Doğum Tarihi:</span> {selectedQuote.birthdate || '-'}</div>
                  <div><span className="font-medium">Sigorta Türü:</span> {selectedQuote.insuranceType}</div>
                  <div><span className="font-medium">Tarih:</span> {selectedQuote.createdAt?.toDate?.()?.toLocaleDateString('tr-TR')}</div>
                  <div><span className="font-medium">Durum:</span> {getStatusBadge(selectedQuote)}</div>
                </div>
              </div>

              {/* Araç/Mülk Bilgileri */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">
                  {selectedQuote.plate || selectedQuote.registration ? 'Araç Bilgileri' : 'Mülk Bilgileri'}
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedQuote.plate && <div><span className="font-medium">Plaka:</span> {selectedQuote.plate}</div>}
                  {selectedQuote.registration && <div><span className="font-medium">Ruhsat:</span> {selectedQuote.registration}</div>}
                  {selectedQuote.propertyType && <div><span className="font-medium">Mülk Türü:</span> {selectedQuote.propertyType}</div>}
                  {selectedQuote.address && <div><span className="font-medium">Adres:</span> {selectedQuote.address}</div>}
                </div>
              </div>

              {/* Admin Cevabı */}
              {selectedQuote.adminResponse && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-3">Admin Cevabı</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Açıklama:</span> {selectedQuote.adminResponse}</div>
                    {selectedQuote.price && <div><span className="font-medium">Fiyat:</span> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(selectedQuote.price))}</div>}
                    {selectedQuote.adminNotes && <div><span className="font-medium">Admin Notları:</span> {selectedQuote.adminNotes}</div>}
                    <div><span className="font-medium">Cevap Tarihi:</span> {selectedQuote.responseDate?.toDate?.()?.toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              )}

              {/* Red Bilgisi */}
              {selectedQuote.rejectionReason && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-3">Red Bilgisi</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Red Nedeni:</span> {selectedQuote.rejectionReason}</div>
                    <div><span className="font-medium">Red Tarihi:</span> {selectedQuote.responseDate?.toDate?.()?.toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              )}

              {/* Müşteri Red Bilgisi */}
              {selectedQuote.customerStatus === 'rejected' && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-700 mb-3">Müşteri Red Bilgisi</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Müşteri Red Nedeni:</span> {selectedQuote.customerRejectionReason || 'Belirtilmemiş'}</div>
                    <div><span className="font-medium">Red Tarihi:</span> {selectedQuote.customerResponseDate?.toDate?.()?.toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              )}

              {/* Ödeme Bilgisi */}
              {selectedQuote.customerStatus === 'card_submitted' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-3">Ödeme Bilgisi</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Durum:</span> {selectedQuote.documentUrl ? 'Belge Yüklendi' : 'Kart Bilgileri Alındı'}</div>
                    <div><span className="font-medium">Kart Sahibi:</span> {selectedQuote.paymentInfo?.cardHolder}</div>
                    <div><span className="font-medium">Kart No:</span> **** **** **** {selectedQuote.paymentInfo?.originalCardNumber?.slice(-4)}</div>
                    <div><span className="font-medium">Taksit:</span> {selectedQuote.paymentInfo?.installments === '1' ? 'Tek Çekim' : selectedQuote.paymentInfo?.installments + ' Taksit'}</div>
                    <div><span className="font-medium">Ödeme Tarihi:</span> {selectedQuote.customerResponseDate?.toDate?.()?.toLocaleDateString('tr-TR')}</div>
                    {selectedQuote.documentUrl && (
                      <div><span className="font-medium">Belge:</span> <a href={selectedQuote.documentUrl} target="_blank" className="text-blue-600 hover:underline">İndir</a></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowQuoteDetailModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kullanıcı Ekleme/Düzenleme Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={saveUser}>
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
                    disabled={isEditMode}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">TC Kimlik No</label>
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

                <div>
                  <label className="block text-gray-700 mb-2">Araç Plakası</label>
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
                  <label className="block text-gray-700 mb-2">Mülk Adresi</label>
                  <textarea
                    value={userFormData.propertyAddress}
                    onChange={(e) => setUserFormData({...userFormData, propertyAddress: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  {isEditMode ? 'Güncelle' : 'Kullanıcı Ekle'}
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

      {/* Diğer modaller buraya eklenecek... */}
      {/* Teklif Cevaplama, Kart Bilgileri, Belge Yükleme modalleri */}
    </div>
  );
}