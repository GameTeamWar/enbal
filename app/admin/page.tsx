'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

import QuoteDetailModal from '@/app/components/admin/QuoteDetailModal';
import UserModal from '@/app/components/admin/UserModal';
import ResponseModal from '@/app/components/admin/ResponseModal';
import UploadModal from '@/app/components/admin/UploadModal';


function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('quotes');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [responseData, setResponseData] = useState({
    adminResponse: '',
    price: '',
    adminNotes: ''
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showCardInfoModal, setShowCardInfoModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCardQuote, setSelectedCardQuote] = useState<any>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [newQuotesCount, setNewQuotesCount] = useState(0);
  const [paidQuotesCount, setPaidQuotesCount] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    tcno: '',
    email: '',
    role: 'user',
    password: ''
  });

  const notificationSound = typeof Audio !== 'undefined' ? new Audio('/sounds/nsound.mp3') : null;

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
          [key: string]: any;
        };
        quotesData.push(data);
        
        if (data.status === 'pending') {
          pendingCount++;
        }
        
        if (data.customerStatus === 'card_submitted' && data.awaitingProcessing) {
          paidCount++;
        }
      });
      
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

  const deleteQuote = async (quote: any) => {
    if (confirm('Bu teklifi kalıcı olarak silmek istediğinizden emin misiniz?')) {
      await deleteDoc(doc(db, 'quotes', quote.id));
      toast.success('Teklif kalıcı olarak silindi!');
    }
  };

  // YENİ FONKSİYON: Kullanıcı ekleme
  const addUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      surname: '',
      phone: '',
      tcno: '',
      email: '',
      role: 'user',
      password: ''
    });
    setShowUserModal(true);
  };

  // YENİ FONKSİYON: Kullanıcı düzenleme
  const editUser = (user: any) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name || '',
      surname: user.surname || '',
      phone: user.phone || '',
      tcno: user.tcno || '',
      email: user.email || '',
      role: user.role || 'user',
      password: '' // Şifre alanı boş bırakılır
    });
    setShowUserModal(true);
  };

  // YENİ FONKSİYON: Kullanıcı kaydetme
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Kullanıcı güncelleme
        const updateData: any = {
          name: userFormData.name,
          surname: userFormData.surname,
          phone: userFormData.phone,
          tcno: userFormData.tcno,
          email: userFormData.email,
          role: userFormData.role,
          updatedAt: new Date()
        };

        await updateDoc(doc(db, 'users', editingUser.id), updateData);
        toast.success('Kullanıcı başarıyla güncellendi!');
      } else {
        // Yeni kullanıcı ekleme
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const { setDoc } = await import('firebase/firestore');
        
        // Firebase Auth ile kullanıcı oluştur
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userFormData.email, 
          userFormData.password
        );

        // Firestore'a kullanıcı bilgilerini kaydet
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userFormData.name,
          surname: userFormData.surname,
          phone: userFormData.phone,
          tcno: userFormData.tcno,
          email: userFormData.email,
          role: userFormData.role,
          createdAt: new Date(),
          createdBy: 'admin',
          isActive: true
        });

        toast.success('Kullanıcı başarıyla eklendi!');
      }

      setShowUserModal(false);
      fetchUsers(); // Kullanıcı listesini yenile
    } catch (error: any) {
      console.error('Kullanıcı kaydetme hatası:', error);
      
      let errorMessage = 'Bir hata oluştu!';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu email adresi zaten kullanımda!';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf! En az 6 karakter olmalıdır.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi!';
      }
      
      toast.error(errorMessage);
    }
  };

  // Telefon numarası formatlaması
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = numbers;
    if (formatted.length > 0 && !formatted.startsWith('0')) {
      formatted = '0' + formatted;
    }
    formatted = formatted.slice(0, 11);
    
    if (formatted.length > 4) {
      formatted = formatted.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    } else if (formatted.length > 2) {
      formatted = formatted.replace(/(\d{4})(\d{1,3})/, '$1 $2');
    }
    
    return formatted;
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

    console.log('🔄 Dosya yükleme başlıyor...', {
      fileName: uploadFile.name,
      fileSize: uploadFile.size,
      fileType: uploadFile.type,
      quoteId: selectedQuote.id
    });

    try {
      setUploadProgress(0);
      
      console.log('📦 Storage instance kontrol ediliyor...');
      setUploadProgress(5);
      
      if (!storage.app.options.storageBucket) {
        throw new Error('Firebase Storage bucket yapılandırılmamış!');
      }
      
      console.log('✅ Storage bucket OK:', storage.app.options.storageBucket);
      setUploadProgress(10);
      
      const timestamp = Date.now();
      const fileName = `${timestamp}_${uploadFile.name}`;
      const storageRef = ref(storage, `documents/${selectedQuote.id}/${fileName}`);
      console.log('📂 Storage ref oluşturuldu:', storageRef.fullPath);
      
      setUploadProgress(15);
      
      console.log('⬆️ Dosya yükleme başlatılıyor...');
      const uploadTask = uploadBytesResumable(storageRef, uploadFile);
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const adjustedProgress = 15 + (progress * 0.5);
            setUploadProgress(Math.round(adjustedProgress));
            
            console.log(`📊 Upload progress: ${progress.toFixed(1)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
          },
          (error) => {
            console.error('❌ Upload error:', error);
            setUploadProgress(0);
            reject(error);
          },
          () => {
            console.log('✅ Upload completed successfully');
            setUploadProgress(70);
            resolve(uploadTask.snapshot);
          }
        );
      });
      
      console.log('🔗 Download URL alınıyor...');
      setUploadProgress(75);
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      console.log('✅ Download URL alındı:', downloadURL);
      
      setUploadProgress(85);
      
      console.log('💾 Firestore güncelleniyor...');
      await updateDoc(doc(db, 'quotes', selectedQuote.id), {
        documentUrl: downloadURL,
        documentName: uploadFile.name,
        documentPath: uploadTask.snapshot.ref.fullPath,
        documentSize: uploadFile.size,
        awaitingProcessing: false,
        documentUploadDate: new Date(),
        customerStatus: 'completed'
      });
      
      console.log('✅ Firestore güncellendi');
      setUploadProgress(95);

      console.log('📧 Kullanıcı bildirimi gönderiliyor...');
      await sendUserNotification(selectedQuote.userId, {
        type: 'document_ready',
        quoteId: selectedQuote.id,
        insuranceType: selectedQuote.insuranceType,
        message: 'Belgeleriniz hazır! İndirebilirsiniz.',
        documentUrl: downloadURL
      });

      setUploadProgress(100);
      console.log('🎉 Tüm işlemler tamamlandı!');
      toast.success('🎉 Belge başarıyla yüklendi ve müşteriye bildirildi!');
      
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedQuote(null);
        setUploadFile(null);
        setUploadProgress(0);
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Belge yükleme hatası:', error);
      setUploadProgress(0);
      
      let errorMessage = 'Belge yüklenirken hata oluştu!';
      
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = '🔒 Yetkilendirme hatası! Firebase Security Rules kontrol edilmeli.';
            break;
          case 'storage/canceled':
            errorMessage = '❌ Dosya yükleme iptal edildi.';
            break;
          case 'storage/unknown':
            errorMessage = '🌐 Ağ bağlantı hatası! İnternet bağlantınızı kontrol edin.';
            break;
          case 'storage/invalid-format':
            errorMessage = '📄 Geçersiz dosya formatı! PDF, DOC veya DOCX dosyası seçin.';
            break;
          case 'storage/invalid-checksum':
            errorMessage = '💾 Dosya bozuk! Lütfen farklı bir dosya deneyin.';
            break;
          case 'storage/retry-limit-exceeded':
            errorMessage = '⏰ Yükleme zaman aşımı! Lütfen tekrar deneyin.';
            break;
          case 'storage/quota-exceeded':
            errorMessage = '💽 Depolama alanı dolu! Admin ile iletişime geçin.';
            break;
          default:
            errorMessage = `🔥 Firebase Storage hatası: ${error.code}`;
        }
      } else if (error.message) {
        errorMessage = `❌ Hata: ${error.message}`;
      }
      
      toast.error(errorMessage);
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

      await fetch('/api/trigger-browser-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: getNotificationTitle(notificationData.type),
          body: getNotificationMessage(notificationData),
          type: notificationData.type,
          quoteId: notificationData.quoteId,
          insuranceType: notificationData.insuranceType
        }),
      });

      console.log('✅ Kullanıcı bildirimi gönderildi (Browser + Database)');
    } catch (error) {
      console.error('❌ Kullanıcı bildirimi gönderilemedi:', error);
    }
  };

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'quote_response':
        return '📋 Teklif Cevabı Geldi!';
      case 'quote_rejected':
        return '❌ Teklif Reddedildi';
      case 'document_ready':
        return '📄 Belgeleriniz Hazır!';
      default:
        return '🔔 Enbal Sigorta';
    }
  };

  const getNotificationMessage = (notificationData: any): string => {
    switch (notificationData.type) {
      case 'quote_response':
        return `${notificationData.insuranceType} sigortası teklifiniz cevaplandı. ${
          notificationData.price ? `Fiyat: ${new Intl.NumberFormat('tr-TR', { 
            style: 'currency', 
            currency: 'TRY' 
          }).format(parseFloat(notificationData.price))}` : ''
        }`;
      case 'quote_rejected':
        return `${notificationData.insuranceType} sigortası teklifiniz reddedildi. ${
          notificationData.reason ? `Sebep: ${notificationData.reason}` : ''
        }`;
      case 'document_ready':
        return `${notificationData.insuranceType} sigortası belgeleriniz hazır! Hemen indirin.`;
      default:
        return notificationData.message || 'Yeni bildiriminiz var';
    }
  };

  const getStatusBadge = (quote: any) => {
  let text = '';
  let className = '';

  // Öncelik sırasına göre durum kontrolü
  if (quote.status === 'rejected') {
    text = '❌ Admin Tarafından İptal';
    className = 'bg-red-100 text-red-800';
  } else if (quote.customerStatus === 'rejected') {
    text = '🚫 Müşteri Tarafından Red';
    className = 'bg-red-100 text-red-800';
  } else if (quote.documentUrl) {
    text = '✅ Belgeler Gönderildi';
    className = 'bg-green-100 text-green-800';
  } else if (quote.customerStatus === 'card_submitted') {
    if (quote.awaitingProcessing) {
      text = '💳 Kart Bilgileri Alındı - Belge Hazırlanıyor';
      className = 'bg-orange-100 text-orange-800';
    } else {
      text = '💳 Kart Bilgileri Alındı';
      className = 'bg-blue-100 text-blue-800';
    }
  } else if (quote.status === 'responded') {
    text = '📋 Teklif Cevabı Gönderildi';
    className = 'bg-blue-100 text-blue-800';
  } else if (quote.status === 'pending') {
    text = '⏳ Beklemede - Cevap Bekliyor';
    className = 'bg-yellow-100 text-yellow-800';
  } else {
    text = '❓ Belirsiz Durum';
    className = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>
      {text}
    </span>
  );
};

  const formatCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '';
    return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // KALDIRILAN: maskCardNumber ve maskCVV fonksiyonları - artık kart bilgileri açık görünecek

  // YENİ FONKSİYON: Kopyala fonksiyonu
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopyalandı!`);
    } catch (error) {
      toast.error('Kopyalama başarısız!');
    }
  };

  const testFirebaseStorage = async () => {
    try {
      console.log('🔄 Firebase Storage test başlıyor...');
      
      const testContent = new Blob(['Test file content'], { type: 'text/plain' });
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      const testRef = ref(storage, `test/${Date.now()}_test.txt`);
      
      console.log('📦 Storage config:', {
        bucket: storage.app.options.storageBucket,
        projectId: storage.app.options.projectId,
        path: testRef.fullPath
      });
      
      const snapshot = await uploadBytes(testRef, testFile);
      console.log('✅ Test upload başarılı:', snapshot.ref.fullPath);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL alındı:', downloadURL);
      
      toast.success('Firebase Storage çalışıyor! ✅');
      
    } catch (error: any) {
      console.error('❌ Firebase Storage test hatası:', error);
      toast.error(`Storage test hatası: ${error.code || error.message}`);
    }
  };

  // Eksik fonksiyon: Teklif detaylarını göster
  const showQuoteDetails = (quote: any) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  // Eksik fonksiyon: Belge yükleme modalını aç
  // (Kaldırıldı - duplicate declaration)

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
                onClick={testFirebaseStorage}
                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                title="Firebase Storage Test"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

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
                  <tr className="border-b bg-gray-100 text-gray-600">
                    <th className="text-left py-3 px-4">Tarih</th>
                    <th className="text-left py-3 px-4">Müşteri</th>
                    <th className="text-left py-3 px-4">Sigorta Türü</th>
                    <th className="text-left py-3 px-4">Telefon</th>
                    <th className="text-left py-3 px-4">Fiyat</th>
                    <th className="text-left py-3 px-4">Durum</th>
                    <th className="text-left py-3 px-4">İşlemler</th>
                  </tr>
                </thead>
               <tbody className="text-gray-700">
 {quotes.map((quote) => (
   <tr key={quote.id} className={`border-b ${
     // İptal edilmiş teklifler için kırmızı arka plan
     quote.status === 'rejected' || quote.customerStatus === 'rejected' ? 'bg-red-50 border-red-200' :
     // Belge gönderilmiş teklifler için yeşil arka plan
     quote.documentUrl ? 'bg-green-50 border-green-200' :
     // Kart bilgileri alınmış ama belge beklenen teklifler için sarı arka plan
     quote.customerStatus === 'card_submitted' && quote.awaitingProcessing ? 'bg-yellow-50 border-yellow-200' :
     // Yeni teklifler için hafif sarı arka plan
     quote.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 
     // Diğer durumlar için normal arka plan
     'bg-white'
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
                   {/* İşlemler kolonu - SİLME BUTONU EKLENMİŞ VERSİYON */}
<td className="py-3 px-4">
  <div className="flex space-x-2">
    {/* Detay Butonu - Her zaman görünür */}
    <button
      onClick={() => showQuoteDetails(quote)}
      className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
      title="Teklif detaylarını görüntüle"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Detay</span>
    </button>

   
    {/* İptal Et Butonu - Belge yüklenmemişse VE iptal edilmemişse görünür */}
{!quote.documentUrl && quote.status !== 'rejected' && quote.customerStatus !== 'rejected' && (
  <button
    onClick={() => rejectQuote(quote)}
    className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
    title="Teklifi iptal et"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
    <span>İptal Et</span>
  </button>
)}

    {/* YENİ: Silme Butonu - Her zaman görünür */}
    <button
      onClick={() => deleteQuote(quote)}
      className="text-red-700 hover:text-red-900 font-medium flex items-center space-x-1"
      title="Teklifi kalıcı olarak sil"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span>Sil</span>
    </button>

    {quote.status === 'pending' && (
      <button
        onClick={() => handleQuoteResponse(quote)}
        className="text-green-600 hover:text-green-800 font-medium"
      >
        Cevapla
      </button>
    )}
    
   {/* Belge Yükle Butonu - Kart gönderilmiş, belge yüklenmemiş VE iptal edilmemişse görünür */}
{quote.customerStatus === 'card_submitted' && 
 !quote.documentUrl && 
 quote.status !== 'rejected' && 
 quote.customerStatus !== 'rejected' && (
  <button
    onClick={() => handleDocumentUpload(quote)}
    className="text-green-600 hover:text-green-800 font-medium"
  >
    Belge Yükle
  </button>
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
              {/* Kullanıcı Yönetimi Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h2>
                <button
                  onClick={addUser}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Yeni Kullanıcı Ekle
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">İsim Soyisim</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Telefon</th>
                      <th className="text-left py-3 px-4">TC Kimlik</th>
                      <th className="text-left py-3 px-4">Rol</th>
                      <th className="text-left py-3 px-4">Kayıt Tarihi</th>
                      <th className="text-left py-3 px-4">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-purple-600 font-semibold text-sm">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <span className="font-medium">{user.name} {user.surname}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600">{user.email || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <a href={`tel:${user.phone}`} className="text-purple-600 hover:text-purple-800">
                            {user.phone}
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{user.tcno || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-500">
                            {user.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editUser(user)}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                              title="Kullanıcıyı düzenle"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Düzenle
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-800 font-medium flex items-center"
                              title="Kullanıcıyı sil"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p className="text-gray-500 text-lg">Henüz kullanıcı bulunmamaktadır.</p>
                    <button
                      onClick={addUser}
                      className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      İlk Kullanıcıyı Ekle
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

     <QuoteDetailModal
  isOpen={showDetailsModal}
  quote={selectedQuote}
  users={users}
  onClose={() => setShowDetailsModal(false)}
  onQuoteResponse={handleQuoteResponse}
  onDocumentUpload={handleDocumentUpload}
  onRejectQuote={rejectQuote}
  getStatusBadge={getStatusBadge}
  copyToClipboard={copyToClipboard}
/>

<UserModal
  isOpen={showUserModal}
  editingUser={editingUser}
  userFormData={userFormData}
  onClose={() => setShowUserModal(false)}
  onSave={saveUser}
  onChange={setUserFormData}
  formatPhone={formatPhone}
/>

<ResponseModal
  isOpen={showResponseModal}
  quote={selectedQuote}
  responseData={responseData}
  onClose={() => setShowResponseModal(false)}
  onSend={sendQuoteResponse}
  onChange={setResponseData}
/>

<UploadModal
  isOpen={showUploadModal}
  quote={selectedQuote}
  uploadFile={uploadFile}
  uploadProgress={uploadProgress}
  onClose={() => {
    setShowUploadModal(false);
    setUploadFile(null);
    setSelectedQuote(null);
    setUploadProgress(0);
  }}
  onUpload={uploadDocument}
  onFileSelect={setUploadFile}
/>
    </div>
  </>
);
}

export default Admin;