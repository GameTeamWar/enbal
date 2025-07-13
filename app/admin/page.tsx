'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
    let status = quote.status;
    let text = '';
    let className = '';

    if (quote.customerStatus === 'card_submitted') {
      if (quote.documentUrl) {
        status = 'completed';
        text = '✅ Belgeler Gönderildi';
        className = 'bg-green-100 text-green-800';
      } else {
        status = 'card_received';
        text = '💳 Kart Bilgileri Alındı';
        className = 'bg-orange-100 text-orange-800';
      }
    } else if (quote.customerStatus === 'rejected') {
      status = 'customer_rejected';
      text = 'Müşteri Reddi';
      className = 'bg-gray-100 text-gray-800';
    } else {
      const statusConfig = {
        pending: { text: 'Beklemede', class: 'bg-yellow-100 text-yellow-800' },
        responded: { text: 'Cevaplandı', class: 'bg-blue-100 text-blue-800' },
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
                <tbody  className="text-gray-700">
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
                          {/* YENİ: Detay Butonu - Her zaman görünür */}
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
                          
                          {quote.customerStatus === 'card_submitted' && (
                            <>
                              {!quote.documentUrl ? (
                                <>
                              
                                  <button
                                    onClick={() => handleDocumentUpload(quote)}
                                    className="text-green-600 hover:text-green-800 font-medium"
                                  >
                                    Belge Yükle
                                  </button>
                                </>
                              ) : (
                                <span className="text-green-600 font-medium">✅ Belge Gönderildi</span>
                              )}
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

    
      {showDetailsModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Teklif Detayları
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sol Kolon - Temel Bilgiler */}
              <div className="space-y-6">
                {/* Teklif Bilgileri */}
                <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    📋 Teklif Bilgileri
                  </h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Teklif ID:</span>
                      <code className="bg-blue-200 px-2 py-1 rounded text-sm">{selectedQuote.id}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Sigorta Türü:</span>
                      <span className="font-semibold">{selectedQuote.insuranceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Durum:</span>
                      {getStatusBadge(selectedQuote)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Oluşturma Tarihi:</span>
                      <span>{selectedQuote.createdAt?.toDate?.()?.toLocaleString('tr-TR') || 'N/A'}</span>
                    </div>
                    {selectedQuote.responseDate && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Cevap Tarihi:</span>
                        <span>{selectedQuote.responseDate?.toDate?.()?.toLocaleString('tr-TR')}</span>
                      </div>
                    )}
                    {selectedQuote.price && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Fiyat:</span>
                        <span className="text-lg font-bold text-green-600">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(selectedQuote.price))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Müşteri Bilgileri */}
                <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    👤 Müşteri Bilgileri
                  </h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">İsim Soyisim:</span>
                      <span className="font-semibold">{selectedQuote.name || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Telefon:</span>
                      <a href={`tel:${selectedQuote.phone}`} className="text-green-600 hover:text-green-800 font-semibold">
                        {selectedQuote.phone}
                      </a>
                    </div>
                    {selectedQuote.tcno && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">TC Kimlik:</span>
                        <span className="font-mono">{selectedQuote.tcno}</span>
                      </div>
                    )}
                    {selectedQuote.birthdate && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Doğum Tarihi:</span>
                        <span>{new Date(selectedQuote.birthdate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                    {selectedQuote.address && (
                      <div>
                        <span className="font-medium text-gray-600 block mb-1">Adres:</span>
                        <p className="text-sm bg-white p-2 rounded border">{selectedQuote.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Araç/Mülk Bilgileri */}
                {(selectedQuote.plate || selectedQuote.registration || selectedQuote.propertyType || selectedQuote.propertyAddress) && (
                  <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {selectedQuote.plate || selectedQuote.registration ? '🚗 Araç Bilgileri' : '🏠 Mülk Bilgileri'}
                    </h4>
                    <div className="space-y-3 text-gray-700">
                      {selectedQuote.plate && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Plaka:</span>
                          <span className="font-mono bg-white px-2 py-1 rounded border">{selectedQuote.plate}</span>
                        </div>
                      )}
                      {selectedQuote.registration && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Ruhsat Seri:</span>
                          <span className="font-mono bg-white px-2 py-1 rounded border">{selectedQuote.registration}</span>
                        </div>
                      )}
                      {selectedQuote.propertyType && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Mülk Türü:</span>
                          <span className="font-semibold">{selectedQuote.propertyType}</span>
                        </div>
                      )}
                      {selectedQuote.propertyAddress && (
                        <div>
                          <span className="font-medium text-gray-600 block mb-1">Mülk Adresi:</span>
                          <p className="text-sm bg-white p-2 rounded border">{selectedQuote.propertyAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sağ Kolon - Admin Notları ve İşlemler */}
              <div className="space-y-6">
                {/* Admin Cevabı */}
                {selectedQuote.adminResponse && (
                  <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      📝 Müşteriye Gönderilen Cevap
                    </h4>
                    <div className="bg-white p-4 rounded border border-blue-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedQuote.adminResponse}</p>
                    </div>
                  </div>
                )}

                {/* Admin Notları */}
                {selectedQuote.adminNotes && (
                  <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      🗒️ Admin Notları (İç Kullanım)
                    </h4>
                    <div className="bg-white p-4 rounded border border-yellow-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedQuote.adminNotes}</p>
                    </div>
                  </div>
                )}

                {/* Red Nedeni */}
                {selectedQuote.rejectionReason && (
                  <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ❌ Red Nedeni
                    </h4>
                    <div className="bg-white p-4 rounded border border-red-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedQuote.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Müşteri Red Nedeni */}
                {selectedQuote.customerRejectionReason && (
                  <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-500">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      👤 Müşteri Red Nedeni
                    </h4>
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedQuote.customerRejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Ödeme Bilgileri */}
                {selectedQuote.paymentInfo && (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-500">
    <h4 className="font-bold text-green-800 mb-4 flex items-center text-lg">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      💳 KART BİLGİLERİ (AÇIK GÖRÜNÜM)
    </h4>
    
    <div className="space-y-4">
      {/* Kart Sahibi */}
      <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <span className="font-bold text-gray-700 text-sm block mb-1">👤 KART SAHİBİ:</span>
            <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block">
              {selectedQuote.paymentInfo.cardHolder}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(selectedQuote.paymentInfo.cardHolder, 'Kart sahibi')}
            className="ml-3 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md"
            title="Kart sahibini kopyala"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Kart Numarası */}
      <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <span className="font-bold text-gray-700 text-sm block mb-1">💳 KART NUMARASI:</span>
            <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block font-mono">
              {(selectedQuote.paymentInfo.originalCardNumber || selectedQuote.paymentInfo.cardNumber).replace(/(\d{4})(?=\d)/g, '$1 ')}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(
              (selectedQuote.paymentInfo.originalCardNumber || selectedQuote.paymentInfo.cardNumber).replace(/\s/g, ''), 
              'Kart numarası'
            )}
            className="ml-3 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
            title="Kart numarasını kopyala"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Son Kullanma ve CVV - Yan Yana */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <span className="font-bold text-gray-700 text-sm block mb-1">📅 SON KULLANMA:</span>
              <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block font-mono">
                {selectedQuote.paymentInfo.expiryDate}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(selectedQuote.paymentInfo.expiryDate, 'Son kullanma tarihi')}
              className="ml-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-md"
              title="Son kullanma tarihini kopyala"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <span className="font-bold text-gray-700 text-sm block mb-1">🔒 CVV KODU:</span>
              <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block font-mono">
                {selectedQuote.paymentInfo.originalCvv || selectedQuote.paymentInfo.cvv}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(
                selectedQuote.paymentInfo.originalCvv || selectedQuote.paymentInfo.cvv, 
                'CVV kodu'
              )}
              className="ml-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
              title="CVV kodunu kopyala"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Taksit ve Gönderim Bilgisi */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
          <span className="font-bold text-gray-700 text-sm block mb-1">💰 TAKSİT:</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border">
              {selectedQuote.paymentInfo.installments === '1' ? 'TEK ÇEKİM' : selectedQuote.paymentInfo.installments + ' TAKSİT'}
            </span>
            <button
              onClick={() => copyToClipboard(
                selectedQuote.paymentInfo.installments === '1' ? 'Tek Çekim' : selectedQuote.paymentInfo.installments + ' Taksit', 
                'Taksit bilgisi'
              )}
              className="ml-2 p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-md"
              title="Taksit bilgisini kopyala"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
          <span className="font-bold text-gray-700 text-sm block mb-1">📅 GÖNDERİM TARİHİ:</span>
          <span className="text-gray-900 text-sm bg-gray-100 px-3 py-2 rounded border block">
            {selectedQuote.customerResponseDate?.toDate?.()?.toLocaleString('tr-TR') || 'Bilinmiyor'}
          </span>
        </div>
      </div>

      {/* Hızlı Kopyalama Butonu */}
      <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
        <button
          onClick={() => {
            const allCardInfo = `
KART SAHİBİ: ${selectedQuote.paymentInfo.cardHolder}
KART NO: ${(selectedQuote.paymentInfo.originalCardNumber || selectedQuote.paymentInfo.cardNumber).replace(/\s/g, '')}
SON KULLANMA: ${selectedQuote.paymentInfo.expiryDate}
CVV: ${selectedQuote.paymentInfo.originalCvv || selectedQuote.paymentInfo.cvv}
TAKSİT: ${selectedQuote.paymentInfo.installments === '1' ? 'Tek Çekim' : selectedQuote.paymentInfo.installments + ' Taksit'}
TUTAR: ${selectedQuote.price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(selectedQuote.price)) : 'Belirtilmemiş'}
            `.trim();
            copyToClipboard(allCardInfo, 'Tüm kart bilgileri');
          }}
          className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition shadow-lg font-bold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          📋 TÜM KART BİLGİLERİNİ KOPYALA
        </button>
      </div>
    </div>

    {/* Güvenlik Uyarısı */}
    <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
      <div className="flex items-start space-x-2">
        <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="text-yellow-800 font-medium text-xs">🔒 GÜVENLİK UYARISI</p>
          <p className="text-yellow-700 text-xs mt-1">
            Bu bilgiler hassastır! İşlem tamamlandıktan sonra güvenli şekilde saklayın ve yetkisiz kişilerle paylaşmayın.
          </p>
        </div>
      </div>
    </div>
  </div>
)}

                {/* Sistem Bilgileri */}
                <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-400">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ⚙️ Sistem Bilgileri
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between ">
                      <span className="font-medium text-gray-600">Kullanıcı ID:</span>
                      <code className="bg-white px-2 py-1 rounded text-xs">{selectedQuote.userId || 'Misafir'}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Kendi Bilgileri:</span>
                      <span className={selectedQuote.isForSelf ? 'text-green-600' : 'text-gray-600'}>
                        {selectedQuote.isForSelf ? 'Evet' : 'Hayır'}
                      </span>
                    </div>
                    {selectedQuote.awaitingProcessing !== undefined && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">İşlem Bekliyor:</span>
                        <span className={selectedQuote.awaitingProcessing ? 'text-orange-600' : 'text-green-600'}>
                          {selectedQuote.awaitingProcessing ? 'Evet' : 'Hayır'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Alt Kısım - Hızlı İşlemler */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="font-semibold text-gray-700 mb-4">🚀 Hızlı İşlemler</h4>
              <div className="flex flex-wrap gap-3">
                {selectedQuote.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleQuoteResponse(selectedQuote);
                      }}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Cevapla
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        rejectQuote(selectedQuote);
                      }}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reddet
                      </button>
                 </>
               )}

               {selectedQuote.customerStatus === 'card_submitted' && !selectedQuote.documentUrl && (
                 <>
                  
                   <button
                     onClick={() => {
                       setShowDetailsModal(false);
                       handleDocumentUpload(selectedQuote);
                     }}
                     className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                     </svg>
                     Belge Yükle
                   </button>
                 </>
               )}

               <button
                 onClick={() => {
                   window.open(`https://wa.me/90${selectedQuote.phone.replace(/\D/g, '')}`, '_blank');
                 }}
                 className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
               >
                 <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.75"/>
                 </svg>
                 WhatsApp
               </button>

               <button
                 onClick={() => setShowDetailsModal(false)}
                 className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
               >
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
                 Kapat
               </button>
             </div>
           </div>
         </div>
       </div>
     )}

      {/* YENİ: User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
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

            <form onSubmit={saveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soyisim</label>
                  <input
                    type="text"
                    required
                    value={userFormData.surname}
                    onChange={(e) => setUserFormData({...userFormData, surname: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  required
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({...userFormData, phone: formatPhone(e.target.value)})}
                  placeholder="0XXX XXX XX XX"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
                <input
                  type="text"
                  value={userFormData.tcno}
                  onChange={(e) => setUserFormData({...userFormData, tcno: e.target.value.replace(/\D/g, '').slice(0, 11)})}
                  placeholder="11 haneli TC kimlik numarası"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                    placeholder="En az 6 karakter"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition"
                >
                  {editingUser ? 'Güncelle' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Teklif Cevabı Gönder</h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteriye Gönderilecek Açıklama *
                </label>
                <textarea
                  value={responseData.adminResponse}
                  onChange={(e) => setResponseData({...responseData, adminResponse: e.target.value})}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Teklif açıklamasını buraya yazın..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat (TL)
                </label>
                <input
                  type="number"
                  value={responseData.price}
                  onChange={(e) => setResponseData({...responseData, price: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notları (İç kullanım)
                </label>
                <textarea
                  value={responseData.adminNotes}
                  onChange={(e) => setResponseData({...responseData, adminNotes: e.target.value})}
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="İç notlarınızı buraya yazabilirsiniz..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={sendQuoteResponse}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
                >
                  Cevabı Gönder
                </button>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Belge Yükle</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosya Seç (PDF, DOC, DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Yükleniyor...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${uploadProgress}%`}}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={uploadDocument}
                  disabled={!uploadFile || uploadProgress > 0}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadProgress > 0 ? 'Yükleniyor...' : 'Yükle'}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadProgress > 0}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Info Modal - Güncellenmiş */}
      {showCardInfoModal && selectedCardQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                💳 Kart Bilgileri
              </h3>
              <button
                onClick={() => setShowCardInfoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedCardQuote.paymentInfo && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm opacity-80">Kart Sahibi</p>
                      <p className="text-lg font-semibold">{selectedCardQuote.paymentInfo.cardHolder}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedCardQuote.paymentInfo.cardHolder, 'Kart sahibi')}
                      className="text-white hover:text-gray-200 p-1"
                      title="Kopyala"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-sm opacity-80">Kart Numarası</p>
                      <p className="text-xl font-mono tracking-wider">{formatCardNumber(selectedCardQuote.paymentInfo.cardNumber)}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedCardQuote.paymentInfo.cardNumber, 'Kart numarası')}
                      className="text-white hover:text-gray-200 p-1"
                      title="Kopyala"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="text-xs opacity-80">Son Kullanma</p>
                        <p className="font-mono text-lg">{selectedCardQuote.paymentInfo.expiryDate}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedCardQuote.paymentInfo.expiryDate, 'Son kullanma tarihi')}
                        className="text-white hover:text-gray-200 p-1"
                        title="Kopyala"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="text-xs opacity-80">CVV</p>
                        <p className="font-mono text-lg">{selectedCardQuote.paymentInfo.cvv}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedCardQuote.paymentInfo.cvv, 'CVV')}
                        className="text-white hover:text-gray-200 p-1"
                        title="Kopyala"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Taksit Seçimi</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {selectedCardQuote.paymentInfo.installments === '1' ? 
                        '💰 Tek Çekim' : 
                        `📅 ${selectedCardQuote.paymentInfo.installments} Taksit`
                      }
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Gönderim Tarihi</p>
                    <p className="text-sm font-semibold text-green-800">
                      {selectedCardQuote.customerResponseDate?.toDate?.()?.toLocaleString('tr-TR') || 'Bilinmiyor'}
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-yellow-800 font-medium">🔒 Güvenlik Uyarısı</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Bu bilgiler hassas verilerdir. Lütfen güvenli şekilde saklayın ve yetkisiz kişilerle paylaşmayın.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const allCardInfo = 
                        `Kart Sahibi: ${selectedCardQuote.paymentInfo.cardHolder}\n` +
                        `Kart Numarası: ${selectedCardQuote.paymentInfo.cardNumber}\n` +
                        `Son Kullanma: ${selectedCardQuote.paymentInfo.expiryDate}\n` +
                        `CVV: ${selectedCardQuote.paymentInfo.cvv}\n` +
                        `Taksit: ${selectedCardQuote.paymentInfo.installments === '1' ? 'Tek Çekim' : selectedCardQuote.paymentInfo.installments + ' Taksit'}`;
                      copyToClipboard(allCardInfo, 'Tüm kart bilgileri');
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Tümünü Kopyala
                  </button>
                  <button
                    onClick={() => setShowCardInfoModal(false)}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;