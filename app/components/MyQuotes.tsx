'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';

export default function MyQuotes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    installments: '1'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setupQuotesListener(authUser.uid);
        setupNotificationsListener(authUser.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const setupQuotesListener = (userId: string) => {
    const q = query(
      collection(db, 'quotes'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const quotesData: any[] = [];
      querySnapshot.forEach((doc) => {
        quotesData.push({ id: doc.id, ...doc.data() });
      });
      setQuotes(quotesData);
    });

    return unsubscribe;
  };

  const setupNotificationsListener = (userId: string) => {
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: any[] = [];
      querySnapshot.forEach((doc) => {
        notificationsData.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notificationsData);
      
      // Yeni bildirimler için browser notification
      notificationsData.forEach(notification => {
        if (!notification.read && (notification.type === 'quote_response' || notification.type === 'quote_rejected' || notification.type === 'document_ready')) {
          showBrowserNotification(notification);
        }
      });
    });

    return unsubscribe;
  };

  const showBrowserNotification = (notification: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(notification.title || 'Teklif Güncellemesi!', {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });

      notif.onclick = () => {
        window.focus();
        markNotificationAsRead(notification.id);
      };
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
    }
  };

  // Taksit seçenekleri oluşturma fonksiyonu
  const generateInstallmentOptions = (maxInstallments: number = 1) => {
    // console.log('🔍 generateInstallmentOptions çağrıldı:', { maxInstallments });
    
    const options = [];
    
    // Tek çekim her zaman ilk seçenek
    options.push({ value: '1', label: 'Tek Çekim' });
    
    // maxInstallments kontrolü
    if (!maxInstallments || maxInstallments <= 1) {
      // console.log('⚠️ maxInstallments 1 veya undefined, sadece tek çekim döndürülüyor');
      return options;
    }
    
    // Diğer taksit seçenekleri (admin'in belirlediği maksimuma kadar)
    const standardInstallments = [2, 3, 6, 9, 12, 18, 24];
    
    for (const installment of standardInstallments) {
      if (installment <= maxInstallments) {
        options.push({ 
          value: installment.toString(), 
          label: `${installment} Taksit` 
        });
        // console.log(`✅ Taksit eklendi: ${installment}`);
      }
    }
    
    // console.log('📋 Final options:', options);
    return options;
  };

  // Taksit tutarını hesaplama
  const calculateInstallmentAmount = (totalPrice: string, installments: string) => {
    if (!totalPrice || !installments) return 0;
    const total = parseFloat(totalPrice);
    const installmentCount = parseInt(installments);
    return installmentCount > 1 ? total / installmentCount : total;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuote) return;

    try {
      // Taksit tutarını hesapla
      const totalAmount = parseFloat(selectedQuote.price);
      const installmentCount = parseInt(paymentData.installments);
      const installmentAmount = installmentCount > 1 ? totalAmount / installmentCount : totalAmount;

      // Kart bilgilerini ve durumu güncelle
      await updateDoc(doc(db, 'quotes', selectedQuote.id), {
        customerStatus: 'card_submitted',
        paymentInfo: {
          cardNumber: '**** **** **** ' + paymentData.cardNumber.slice(-4),
          originalCardNumber: paymentData.cardNumber,
          cardHolder: paymentData.cardHolder,
          expiryDate: paymentData.expiryDate,
          cvv: '***',
          originalCvv: paymentData.cvv,
          installments: paymentData.installments,
          installmentAmount: installmentAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          submissionDate: new Date()
        },
        customerResponseDate: new Date(),
        awaitingProcessing: true
      });

      // Admin'e kart bilgileri bildirimi gönder
      await fetch('/api/payment-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: selectedQuote.id,
          customerName: selectedQuote.name,
          insuranceType: selectedQuote.insuranceType,
          price: selectedQuote.price,
          paymentInfo: {
            cardNumber: paymentData.cardNumber,
            cardHolder: paymentData.cardHolder,
            expiryDate: paymentData.expiryDate,
            cvv: paymentData.cvv,
            installments: paymentData.installments,
            installmentAmount: installmentAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2)
          }
        }),
      });

      const installmentText = installmentCount === 1 ? 'tek çekim' : `${installmentCount} taksit`;
      toast.success(`Kart bilgileriniz alınmıştır! ${installmentText} seçiminiz kaydedildi. 30 dakika içinde belgeleriniz hazırlanacak.`);
      
      setShowPaymentModal(false);
      setSelectedQuote(null);
      setPaymentData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardHolder: '',
        installments: '1'
      });
    } catch (error) {
      toast.error('Kart bilgileri gönderilemedi!');
      console.error(error);
    }
  };

  // YENİ ÇÖZÜM: API Route üzerinden indirme
  const downloadDocument = async (quote: any) => {
    if (!quote.documentUrl) {
      toast.error('Belge henüz hazırlanmamış!');
      return;
    }

    try {
      // console.log('API üzerinden dosya indirme başlıyor...');
      const loadingToast = toast.loading('Belge hazırlanıyor...');

      // API route'u kullanarak indir
      const response = await fetch('/api/download-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          documentUrl: quote.documentUrl,
          fileName: quote.documentName || 'belge.pdf'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Blob olarak al
      const blob = await response.blob();
      // console.log('Blob alındı:', blob.size, 'bytes');

      // Content-Disposition header'ından dosya adını al
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = quote.documentName || 'belge.pdf';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // Güvenli dosya adı oluştur
      const safeFileName = `${quote.insuranceType}_${quote.id}_${fileName}`.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Dosyayı indir
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = safeFileName;
      
      document.body.appendChild(a);
      a.click();
      
      // Temizlik
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.dismiss(loadingToast);
      toast.success(`${safeFileName} başarıyla indirildi!`);
      
    } catch (error: any) {
      console.error('API download hatası:', error);
      
      // Fallback: Direct link yöntemi
      // console.log('Fallback yöntemine geçiliyor...');
      await downloadDocumentDirect(quote);
    }
  };

  // FALLBACK: Direct download yöntemi
  const downloadDocumentDirect = async (quote: any) => {
    try {
      // console.log('Direct download başlıyor...');
      
      // Firebase Storage'dan fresh URL al
      if (quote.documentPath) {
        // console.log('Storage path ile fresh URL alınıyor:', quote.documentPath);
        const storageRef = ref(storage, quote.documentPath);
        const freshUrl = await getDownloadURL(storageRef);
        // console.log('Fresh URL alındı:', freshUrl);
        
        // Yeni pencerede aç
        window.open(freshUrl, '_blank');
        toast.success('Belge yeni sekmede açıldı!');
      } else {
        // Mevcut URL ile dene
        // console.log('Mevcut URL ile deneniyor:', quote.documentUrl);
        window.open(quote.documentUrl, '_blank');
        toast.success('Belge yeni sekmede açıldı!');
      }
      
    } catch (error: any) {
      console.error('Direct download hatası:', error);
      
      // Son çare: Manual link
      const userWantsManual = confirm(
        'Dosya otomatik olarak açılamadı. Manuel indirme linkini kopyalamak ister misiniz?'
      );
      
      if (userWantsManual) {
        try {
          await navigator.clipboard.writeText(quote.documentUrl);
          toast.success('İndirme linki panoya kopyalandı! Yeni sekmede yapıştırabilirsiniz.');
        } catch {
          alert(`Manuel indirme linki: ${quote.documentUrl}`);
        }
      }
    }
  };

  const acceptQuote = async (quote: any) => {
    // console.log('🎯 acceptQuote çağrıldı:', {
    //   quoteId: quote.id,
    //   price: quote.price,
    //   maxInstallments: quote.maxInstallments,
    //   status: quote.status
    // });
    
    if (!quote.price) {
      toast.error('Bu teklif için fiyat bilgisi bulunmuyor!');
      return;
    }
    
    setSelectedQuote(quote);
    setPaymentData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardHolder: '',
      installments: '1'
    });
    setShowPaymentModal(true);
  };

  const rejectQuote = async (quote: any) => {
    const reason = prompt('Red nedeni (opsiyonel):');
    
    try {
      await updateDoc(doc(db, 'quotes', quote.id), {
        customerStatus: 'rejected',
        customerRejectionReason: reason || 'Kullanıcı tarafından reddedildi',
        customerResponseDate: new Date()
      });

      toast.success('Teklif reddedildi!');
    } catch (error) {
      toast.error('Bir hata oluştu!');
      console.error(error);
    }
  };

  // Modal içinde taksit değişimi
  const handleInstallmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // console.log('🔄 Taksit değiştirildi:', e.target.value);
    setPaymentData({...paymentData, installments: e.target.value});
  };

  // Option render
  const renderInstallmentOption = (option: any) => {
    // console.log('📝 Option render:', option);
    return (
      <option key={option.value} value={option.value}>
        {option.label}
        {option.value !== '1' && ` (${formatPrice(calculateInstallmentAmount(selectedQuote.price, option.value).toString())} × ${option.value})`}
      </option>
    );
  };

  const getStatusBadge = (quote: any) => {
    const status = quote.customerStatus || quote.status;
    const statusConfig = {
      pending: { text: 'Beklemede', class: 'bg-yellow-100 text-yellow-800' },
      responded: { text: 'Cevaplandı', class: 'bg-blue-100 text-blue-800' },
      card_submitted: { text: 'Ödeme Bilgileri Gönderildi', class: 'bg-orange-100 text-orange-800' },
      completed: { text: 'Tamamlandı', class: 'bg-green-100 text-green-800' },
      rejected: { text: 'Reddedildi', class: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-sm ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(parseFloat(price));
  };

  const openWhatsApp = (quote: any) => {
    const message = `Merhaba, ${quote.insuranceType} teklifim hakkında bilgi almak istiyorum. Teklif ID: ${quote.id}`;
    const whatsappUrl = `https://wa.me/905354979353?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Tekliflerim</h1>
            </div>

            {/* Bildirimler */}
            {notifications.filter(n => !n.read).length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  Yeni Bildirimler ({notifications.filter(n => !n.read).length})
                </h2>
                <div className="space-y-3">
                  {notifications.filter(n => !n.read).map((notification) => (
                    <div 
                      key={notification.id} 
                      className="bg-red-50 border-l-4 border-red-500 p-4 rounded cursor-pointer hover:bg-red-100 transition"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-8 8a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H3z" clipRule="evenodd" />
                            </svg>
                            {notification.title || 'Bildirim'}
                          </p>
                          <p className="text-red-600">
                            {notification.message}
                          </p>
                        </div>
                        <div className="text-red-500 text-sm">
                          {notification.createdAt?.toDate?.()?.toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teklifler */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Teklif Geçmişi</h2>
              
              {quotes.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">Henüz teklif talebiniz bulunmamaktadır.</p>
                  <a
                    href="/"
                    className="mt-4 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Teklif Al
                  </a>
                </div>
              ) : (
                <div className="grid gap-6">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{quote.insuranceType}</h3>
                          <p className="text-gray-600">Teklif ID: {quote.id}</p>
                          <p className="text-sm text-gray-500">
                            {quote.createdAt?.toDate?.()?.toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(quote)}
                          {quote.price && (
                            <div className="mt-2">
                              <div className="text-2xl font-bold text-green-600">
                                {formatPrice(quote.price)}
                              </div>
                              {/* Taksit bilgisi gösterimi */}
                              {quote.maxInstallments && quote.maxInstallments > 1 && (
                                <div className="text-sm text-blue-600 font-medium">
                                  {quote.maxInstallments} taksit'e kadar
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-black">
                        <div>
                          <span className="font-medium text-gray-600">Müşteri:</span>
                          <p>{quote.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Telefon:</span>
                          <p>{quote.phone}</p>
                        </div>
                        {quote.plate && (
                          <div>
                            <span className="font-medium text-gray-600">Plaka:</span>
                            <p>{quote.plate}</p>
                          </div>
                        )}
                        {quote.propertyType && (
                          <div>
                            <span className="font-medium text-gray-600">Mülk Türü:</span>
                            <p>{quote.propertyType}</p>
                          </div>
                        )}
                      </div>

                      {quote.adminResponse && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-green-800 mb-2">Admin Cevabı:</h4>
                          <p className="text-green-700">{quote.adminResponse}</p>
                          {quote.responseDate && (
                            <p className="text-sm text-green-600 mt-2">
                              Cevap Tarihi: {quote.responseDate?.toDate?.()?.toLocaleDateString('tr-TR')}
                            </p>
                          )}
                          {/* Taksit detayları */}
                          {quote.maxInstallments && quote.maxInstallments > 1 && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <h5 className="font-medium text-green-900 mb-2">
                                Taksit Seçenekleri: (Max: {quote.maxInstallments})
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-green-800">
                                {generateInstallmentOptions(quote.maxInstallments).slice(0, 6).map(option => (
                                  <div key={option.value} className="text-center p-2 bg-green-50 rounded">
                                    <div className="font-medium">{option.label}</div>
                                    {option.value !== '1' && (
                                      <div className="text-green-600 text-xs">
                                        {formatPrice(calculateInstallmentAmount(quote.price, option.value).toString())} × {option.value}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {generateInstallmentOptions(quote.maxInstallments).length > 6 && (
                                <div className="mt-2 text-xs text-green-600">
                                  + {generateInstallmentOptions(quote.maxInstallments).length - 6} seçenek daha...
                                </div>
                              )}
                            </div>
                          )}
                          {/* Eğer maxInstallments yoksa veya 1 ise */}
                          {(!quote.maxInstallments || quote.maxInstallments <= 1) && (
                            <div className="mt-2 text-xs text-gray-500">
                              Sadece tek çekim mevcut
                            </div>
                          )}
                        </div>
                      )}

                      {quote.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-red-800 mb-2">Red Nedeni:</h4>
                          <p className="text-red-700">{quote.rejectionReason}</p>
                        </div>
                      )}

                      {quote.customerStatus === 'card_submitted' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-blue-800 mb-2">
                            {quote.documentUrl ? '✅ Belgeleriniz Hazır!' : '⏳ Kart Bilgileri Durumu:'}
                          </h4>
                          {quote.documentUrl ? (
                            <p className="text-blue-700">Belgeleriniz hazırlandı! Aşağıdaki butondan indirebilirsiniz.</p>
                          ) : (
                            <>
                              <p className="text-blue-700">Kart bilgileriniz alınmıştır. 30 dakika içinde belgeleriniz hazırlanacak.</p>
                              {/* Ödeme detayları */}
                              {quote.paymentInfo && (
                                <div className="mt-2 text-sm text-blue-600">
                                  <p>Ödeme: {quote.paymentInfo.installments === '1' ? 'Tek Çekim' : `${quote.paymentInfo.installments} Taksit`}</p>
                                  {quote.paymentInfo.installments !== '1' && (
                                    <p>Aylık: {formatPrice(quote.paymentInfo.installmentAmount)} × {quote.paymentInfo.installments} = {formatPrice(quote.paymentInfo.totalAmount)}</p>
                                  )}
                                </div>
                              )}
                              <div className="mt-2 text-sm text-blue-600">
                                Gönderim: {quote.customerResponseDate?.toDate?.()?.toLocaleString('tr-TR')}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        {/* Teklif Kabul/Red Butonları */}
                        {quote.status === 'responded' && !quote.customerStatus && quote.price && (
                          <>
                            <button
                              onClick={() => acceptQuote(quote)}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Kabul Et</span>
                            </button>
                            <button
                              onClick={() => rejectQuote(quote)}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Reddet</span>
                            </button>
                          </>
                        )}

                        {/* Belge İndirme */}
                        {quote.documentUrl && (
                          <button
                            onClick={() => downloadDocument(quote)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Belgeyi İndir</span>
                          </button>
                        )}

                        {/* WhatsApp */}
                        <button
                          onClick={() => openWhatsApp(quote)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.75"/>
                          </svg>
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ödeme Modal - Gelişmiş Taksit Sistemi */}
        {showPaymentModal && selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Ödeme Bilgileri</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Teklif Özeti</h4>
                <div className="text-sm space-y-1 text-gray-700">
                  <p><span className="font-medium">Sigorta:</span> {selectedQuote.insuranceType}</p>
                  <p><span className="font-medium">Toplam Tutar:</span> {formatPrice(selectedQuote.price)}</p>
                  <p><span className="font-medium">Maks Taksit:</span> {selectedQuote.maxInstallments || 1}</p>
                  {selectedQuote.maxInstallments && selectedQuote.maxInstallments > 1 && (
                    <p><span className="font-medium">Taksit Seçenekleri:</span> {selectedQuote.maxInstallments} taksit'e kadar</p>
                  )}
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-500">
                      Debug - maxInstallments: {JSON.stringify(selectedQuote.maxInstallments)}
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handlePayment}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Kart Numarası *</label>
                  <input
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({...paymentData, cardNumber: formatCardNumber(e.target.value)})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Son Kullanma *</label>
                    <input
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2, 4);
                        }
                        setPaymentData({...paymentData, expiryDate: value});
                      }}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">CVV *</label>
                    <input
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Kart Sahibi *</label>
                  <input
                    type="text"
                    value={paymentData.cardHolder}
                    onChange={(e) => setPaymentData({...paymentData, cardHolder: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="KART SAHİBİ ADI"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Taksit Seçimi *</label>
                  <select
                    value={paymentData.installments}
                    onChange={(e) => {
                      console.log('🔄 Taksit değiştirildi:', e.target.value);
                      setPaymentData({...paymentData, installments: e.target.value});
                    }}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    {generateInstallmentOptions(selectedQuote.maxInstallments || 1).map(option => {
                      console.log('📝 Option render:', option);
                      return (
                        <option key={option.value} value={option.value}>
                          {option.label}
                          {option.value !== '1' && ` (${formatPrice(calculateInstallmentAmount(selectedQuote.price, option.value).toString())} × ${option.value})`}
                        </option>
                      );
                    })}
                  </select>
                  
                  {/* Debug Info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-1 text-xs text-gray-500">
                      Debug: maxInstallments = {selectedQuote.maxInstallments || 'undefined'}, 
                      options = {generateInstallmentOptions(selectedQuote.maxInstallments || 1).length}
                    </div>
                  )}
                  
                  {/* Taksit Detay Gösterimi */}
                  {paymentData.installments !== '1' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Taksit Detayı:</p>
                        <p>
                          {paymentData.installments} × {formatPrice(calculateInstallmentAmount(selectedQuote.price, paymentData.installments).toString())} = {formatPrice(selectedQuote.price)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ödeme Özeti */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Ödeme Özeti</h4>
                  <div className="text-sm space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span>Sigorta Türü:</span>
                      <span className="font-medium">{selectedQuote.insuranceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Toplam Tutar:</span>
                      <span className="font-medium">{formatPrice(selectedQuote.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taksit:</span>
                      <span className="font-medium">
                        {paymentData.installments === '1' 
                          ? 'Tek Çekim' 
                          : `${paymentData.installments} Taksit`
                        }
                      </span>
                    </div>
                    {paymentData.installments !== '1' && (
                      <div className="flex justify-between text-green-600">
                        <span>Aylık Ödeme:</span>
                        <span className="font-semibold">
                          {formatPrice(calculateInstallmentAmount(selectedQuote.price, paymentData.installments).toString())}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {paymentData.installments === '1' 
                    ? `Tek Çekim Öde - ${formatPrice(selectedQuote.price)}`
                    : `${paymentData.installments} Taksit Seç - ${formatPrice(calculateInstallmentAmount(selectedQuote.price, paymentData.installments).toString())}/ay`
                  }
                </button>

                {/* Bilgilendirme */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-yellow-800 font-medium">Güvenlik Bildirimi</p>
                      <p className="text-yellow-700 mt-1">
                        Kart bilgileriniz güvenli şekilde şifrelenir. İşlem onaylandıktan sonra belgeleriniz 30 dakika içinde hazırlanır.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}