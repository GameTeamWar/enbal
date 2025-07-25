// app/admin/page.tsx - Updated with Social Media Tab
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useAdminGuard } from '@/hooks/useAuthGuard';
import toast from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';
import QuoteDetailModal from '@/app/components/admin/QuoteDetailModal';
import ResponseModal from '@/app/components/admin/ResponseModal';
import UploadModal from '@/app/components/admin/UploadModal';
import UsersComponent from '@/app/components/admin/UsersComponent';
import { SocialMediaManagement } from '@/app/components/admin/SocialMediaManagement';
import DeleteConfirmationModal from '@/app/components/admin/DeleteConfirmationModal';
import RejectQuoteModal from '@/app/components/admin/RejectQuoteModal';

export default function Admin() {
  // Auth Guard - Sadece admin rolündeki kullanıcılar erişebilir
  const { user: currentUser, loading: authLoading, isAdmin } = useAdminGuard();

  // ✅ TÜM STATE'LERİ ÖNCE TANIMLA
  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAudioSettingsModal, setShowAudioSettingsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Form states
  const [responseData, setResponseData] = useState({
    adminResponse: '',
    price: '',
    adminNotes: '',
    maxInstallments: 1
  });
  
  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Audio settings
  const [audioSettings, setAudioSettings] = useState({
    enabled: false,
    repeatCount: 3,
    volume: 0.7
  });

  // ✅ Load user audio preferences on mount
  useEffect(() => {
    if (currentUser?.uid) {
      const savedSettings = localStorage.getItem(`audioSettings_${currentUser.uid}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setAudioSettings(parsed);
          setAudioEnabled(parsed.enabled);
        } catch (error) {
          console.error('Error loading audio settings:', error);
        }
      }
    }
  }, [currentUser?.uid]);

  // ✅ Save user audio preferences - Fixed with useCallback
  const saveAudioSettings = useCallback((newSettings: typeof audioSettings) => {
    if (currentUser?.uid) {
      localStorage.setItem(`audioSettings_${currentUser.uid}`, JSON.stringify(newSettings));
      setAudioSettings(newSettings);
      setAudioEnabled(newSettings.enabled);
      toast.success('Ses ayarları kaydedildi!');
    }
  }, [currentUser?.uid]);

  // ✅ Handle audio toggle - Fixed to prevent setState during render
  const handleAudioToggle = useCallback(() => {
    const newSettings = { ...audioSettings, enabled: !audioSettings.enabled };
    saveAudioSettings(newSettings);
  }, [audioSettings, saveAudioSettings]);

  // ✅ Play notification sound function - İYİLEŞTİRİLDİ
  const playNotificationSound = () => {
    if (!audioSettings.enabled) return;
    
    try {
      // console.log('🔊 Admin notification sound starting...');
      
      // 1. Vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 150, 300, 150, 300]);
      }
      
      // 2. HTML5 Audio
      const audio = new Audio();
      audio.volume = audioSettings.volume;
      
      // Try multiple sound sources
      const soundSources = [
        '/notification.mp3',
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUSBTN4yO/Yijci'
      ];
      
      let playCount = 0;
      const maxPlays = audioSettings.repeatCount;
      
      const playNext = () => {
        if (playCount < maxPlays) {
          for (const src of soundSources) {
            try {
              audio.src = src;
              const playPromise = audio.play();
              
              if (playPromise) {
                playPromise.then(() => {
                  playCount++;
                  // console.log(`✅ Admin sound played ${playCount}/${maxPlays}`);
                  
                  if (playCount < maxPlays) {
                    setTimeout(playNext, 800); // 800ms delay between repeats
                  }
                }).catch((error) => {
                  // console.log(`⚠️ Audio play failed (${src}):`, error.message);
                  // Try AudioContext fallback
                  playAudioContextFallback();
                });
              }
              break; // Success, exit loop
            } catch (error) {
              // console.log(`❌ Audio source error: ${src}`);
              continue; // Try next source
            }
          }
        }
      };
      
      playNext();
      
    } catch (error) {
      console.error('Admin notification sound error:', error);
    }
  };

  // ✅ AudioContext Fallback - this kaldırıldı
  const playAudioContextFallback = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      for (let i = 0; i < audioSettings.repeatCount; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 880; // A5 note
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(audioSettings.volume, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.4);
          
          // console.log(`✅ AudioContext fallback played ${i + 1}/${audioSettings.repeatCount}`);
        }, i * 800);
      }
    } catch (error) {
      console.error('AudioContext fallback error:', error);
    }
  };

  // ✅ Real-time Firestore Listeners - Düzeltilmiş
  useEffect(() => {
    if (!currentUser || !isAdmin) return;

    // console.log('🔄 Setting up real-time listeners...');

    // 1. Quotes listener
    const quotesQuery = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribeQuotes = onSnapshot(quotesQuery, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // console.log('📋 Quotes updated:', quotesData.length);
      
      // ✅ Check for new quotes to trigger notification - IMPROVED
      setQuotes(prevQuotes => {
        const previousCount = prevQuotes.length;
        const newCount = quotesData.length;
        
        // Only trigger notification if we have more quotes than before AND audio is enabled
        if (previousCount > 0 && newCount > previousCount && audioSettings.enabled) {
          // console.log('🔔 New quote detected, playing notification sound');
          playNotificationSound();
        }
        
        return quotesData;
      });
    }, (error) => {
      console.error('❌ Quotes listener error:', error);
      toast.error('Teklifler yüklenirken hata oluştu!');
    });

    // 2. Users listener - EN ÖNEMLİSİ!
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // console.log('👥 Users updated:', usersData.length);
      setUsers(usersData);
    }, (error) => {
      console.error('❌ Users listener error:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu!');
    });

    // 3. Password reset requests listener
    const passwordQuery = query(collection(db, 'passwordResetRequests'), orderBy('createdAt', 'desc'));
    const unsubscribePasswordResets = onSnapshot(passwordQuery, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // console.log('🔐 Password resets updated:', requestsData.length);
      setPasswordResetRequests(requestsData);
    }, (error) => {
      console.error('❌ Password resets listener error:', error);
      toast.error('Şifre talepleri yüklenirken hata oluştu!');
    });

    // Cleanup function
    return () => {
      // console.log('🧹 Cleaning up listeners...');
      unsubscribeQuotes();
      unsubscribeUsers();
      unsubscribePasswordResets();
    };
  }, [currentUser, isAdmin, audioSettings.enabled]); // ✅ Added audioSettings.enabled to dependencies

  // ✅ KOŞULLU RENDERING'İ EN SONDA YAP
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yetki kontrol ediliyor...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin || !currentUser) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Yetkisiz Erişim</h1>
            <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </div>
        </div>
      </>
    );
  }

  // ✅ COMPUTED VALUES VE HELPER FUNCTIONS
 // app/admin/page.tsx - COMPUTED VALUES'dan sonuna kadar tam kod

  // ✅ COMPUTED VALUES VE HELPER FUNCTIONS - Düzeltilmiş
  
  // Aktif teklif kontrolü
  const isActiveQuote = (quote: any) => {
    // İptal edilmiş teklifler aktif değil
    if (quote.status === 'rejected' || quote.customerStatus === 'rejected') {
      return false;
    }
    return true;
  };

  // Bekleyen teklif kontrolü  
  const isPendingQuote = (quote: any) => {
    return quote.status === 'pending' && isActiveQuote(quote);
  };

  // Kart bilgisi bekleyen teklif kontrolü
  const isAwaitingPayment = (quote: any) => {
    return quote.customerStatus === 'card_submitted' && 
           quote.awaitingProcessing && 
           !quote.documentUrl &&
           isActiveQuote(quote);
  };

  // Tamamlanmış teklif kontrolü
  const isCompletedQuote = (quote: any) => {
    return quote.documentUrl && isActiveQuote(quote);
  };

  // İptal edilmiş teklif kontrolü
  const isCancelledQuote = (quote: any) => {
    return quote.status === 'rejected' || quote.customerStatus === 'rejected';
  };

  // İptal durumu kontrol fonksiyonu
  const isQuoteCancelled = (quote: any) => {
    return quote.status === 'rejected' || quote.customerStatus === 'rejected';
  };

  // Belge yüklemesi gerekli mi kontrol fonksiyonu
  const shouldShowDocumentUpload = (quote: any) => {
    // İptal edilmişse - HAYIR
    if (isQuoteCancelled(quote)) {
      return false;
    }
    
    // Belge zaten yüklenmişse - HAYIR
    if (quote.documentUrl) {
      return false;
    }
    
    // Kart bilgileri gönderilmiş ve işlem bekliyor mu?
    return quote.customerStatus === 'card_submitted' && quote.awaitingProcessing;
  };

  // ✅ SAYAÇLAR - Düzeltilmiş versiyon
  const newQuotesCount = quotes.filter(quote => isPendingQuote(quote)).length;
  const paidQuotesCount = quotes.filter(quote => isAwaitingPayment(quote)).length;
  const completedQuotesCount = quotes.filter(quote => isCompletedQuote(quote)).length;
  const cancelledQuotesCount = quotes.filter(quote => isCancelledQuote(quote)).length;
  const totalActiveQuotes = quotes.filter(quote => isActiveQuote(quote)).length;
  const pendingPasswordResets = passwordResetRequests.filter(request => request.status === 'pending').length;

  // Helper functions
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopyalandı!`);
    } catch (err) {
      toast.error('Kopyalama işlemi başarısız!');
    }
  };

  // ✅ Kullanıcıya bildirim gönder fonksiyonu
  const sendNotificationToUser = async (userId: string, type: string, data: any) => {
    try {
      // console.log('📨 Kullanıcıya bildirim gönderiliyor:', { userId, type, data });

      let notificationTitle = '';
      let notificationMessage = '';

      switch (type) {
        case 'quote_response':
          notificationTitle = 'Teklif Cevabı Geldi! 🎉';
          notificationMessage = `${data.insuranceType} sigortası teklifiniz cevaplandı.${data.price ? ` Fiyat: ${data.price} TL` : ''}`;
          break;
        case 'quote_rejected':
          notificationTitle = 'Teklif Reddedildi ❌';
          notificationMessage = `${data.insuranceType} sigortası teklifiniz reddedildi.${data.reason ? ` Sebep: ${data.reason}` : ''}`;
          break;
        case 'document_ready':
          notificationTitle = 'Belgeleriniz Hazır! 📄';
          notificationMessage = `${data.insuranceType} sigortası belgeleriniz hazırlandı. İndirebilirsiniz.`;
          break;
        default:
          notificationTitle = 'Teklif Güncellendi';
          notificationMessage = `Teklifiniz hakkında güncelleme var.`;
      }

      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        type: type,
        quoteId: data.quoteId || null,
        insuranceType: data.insuranceType || null,
        title: notificationTitle,
        message: notificationMessage,
        price: data.price || null,
        reason: data.reason || null,
        documentUrl: data.documentUrl || null,
        read: false,
        triggered: true,
        shownInBrowser: false,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || 'admin'
      });

      // console.log('✅ Bildirim Firestore\'a eklendi');
      return true;
    } catch (error) {
      console.error('❌ Kullanıcı bildirimi hatası:', error);
      return false;
    }
  };

  const getStatusBadge = (quote: any) => {
    // ✅ ÖNCE İPTAL DURUMLARINI KONTROL ET
    if (quote.status === 'rejected' || quote.customerStatus === 'rejected') {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          ❌ İptal Edildi
        </span>
      );
    }
    
    // ✅ BELGE YÜKLENMİŞ MI KONTROL ET
    if (quote.documentUrl) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          ✅ Tamamlandı
        </span>
      );
    }
    
    // ✅ KART BİLGİLERİ GÖNDERİLMİŞ VE İŞLEM BEKLİYOR
    if (quote.customerStatus === 'card_submitted' && quote.awaitingProcessing && !quote.documentUrl) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
          💳 Belge Bekleniyor
        </span>
      );
    }
    
    // ✅ ADMIN CEVAP VERMİŞ AMA MÜŞTERİ HENÜZ KABUL ETMEMİŞ
    if (quote.status === 'responded' && !quote.customerStatus) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          📋 Cevap Verildi
        </span>
      );
    }
    
    // ✅ HENÜZ ADMIN CEVABI YOK
    if (quote.status === 'pending') {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
          ⏳ Beklemede
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
        ❓ Bilinmiyor
      </span>
    );
  };

  // Action handlers
  const showQuoteDetails = (quote: any) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

 const handleQuoteResponse = (quote: any) => {
  setSelectedQuote(quote);
  setResponseData({
    adminResponse: '',
    price: '',
    adminNotes: '',
    maxInstallments: 1  // ✅ Default değer
  });
  setShowResponseModal(true);
};

 const sendQuoteResponse = async () => {
  if (!selectedQuote || !responseData.adminResponse.trim()) {
    toast.error('Lütfen açıklama alanını doldurun!');
    return;
  }

  if (!responseData.price || parseFloat(responseData.price) <= 0) {
    toast.error('Lütfen geçerli bir fiyat giriniz!');
    return;
  }

  try {
    // console.log('📤 Admin cevabı gönderiliyor:', {
    //   quoteId: selectedQuote.id,
    //   price: responseData.price,
    //   maxInstallments: responseData.maxInstallments,
    //   adminResponse: responseData.adminResponse.substring(0, 50) + '...'
    // });

    const updateData: any = {
      status: 'responded',
      adminResponse: responseData.adminResponse,
      responseDate: new Date(),
      respondedBy: currentUser?.uid,
      updatedAt: new Date()
    };

    // Fiyat
    if (responseData.price) {
      updateData.price = responseData.price;
    }

    // ✅ maxInstallments - En önemli kısım!
    const maxInstallments = responseData.maxInstallments || 1;
    updateData.maxInstallments = maxInstallments;
    // console.log('💾 maxInstallments kaydediliyor:', maxInstallments);

    // Admin notları
    if (responseData.adminNotes) {
      updateData.adminNotes = responseData.adminNotes;
    }

    // console.log('🔍 Final updateData:', updateData);

    await updateDoc(doc(db, 'quotes', selectedQuote.id), updateData);
    
    // console.log('✅ Firestore güncellendi');
    
    if (selectedQuote.userId) {
      await sendNotificationToUser(selectedQuote.userId, 'quote_response', {
        quoteId: selectedQuote.id,
        insuranceType: selectedQuote.insuranceType,
        price: responseData.price,
        maxInstallments: maxInstallments,
        adminResponse: responseData.adminResponse
      });
    }
    
    toast.success(`Teklif cevabı gönderildi! (${maxInstallments} taksit seçeneği ile)`);
    setShowResponseModal(false);
    setSelectedQuote(null);
  } catch (error) {
    console.error('❌ Cevap gönderme hatası:', error);
    toast.error('Cevap gönderilirken hata oluştu!');
  }
};

  const rejectQuote = async (quote: any) => {
    setSelectedQuote(quote);
    setShowRejectModal(true);
  };

  const confirmRejectQuote = async (reason: string) => {
    if (!selectedQuote) return;
    
    try {
      const updateData: any = {
        status: 'rejected',
        rejectionReason: reason,
        rejectedBy: currentUser?.uid,
        rejectedAt: new Date(),
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'quotes', selectedQuote.id), updateData);
      
      if (selectedQuote.userId) {
        await sendNotificationToUser(selectedQuote.userId, 'quote_rejected', {
          quoteId: selectedQuote.id,
          insuranceType: selectedQuote.insuranceType,
          reason: reason
        });
      }
      
      toast.success('Teklif iptal edildi ve müşteri bilgilendirildi!');
      setShowRejectModal(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error('İptal etme hatası:', error);
      toast.error('Teklif iptal edilirken hata oluştu!');
    }
  };

  const deleteQuote = async (quote: any) => {
    setSelectedQuote(quote);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuote = async () => {
    if (!selectedQuote) return;
    
    try {
      await deleteDoc(doc(db, 'quotes', selectedQuote.id));
      toast.success(`Teklif kalıcı olarak silindi! Müşteri: ${selectedQuote.name} (${selectedQuote.phone})`);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Teklif silinirken hata oluştu!');
    }
  };

  const handleDocumentUpload = (quote: any) => {
    setSelectedQuote(quote);
    setUploadFile(null);
    setUploadProgress(0);
    setShowUploadModal(true);
  };

  const uploadDocument = async () => {
    if (!uploadFile || !selectedQuote) return;

    const storageRef = ref(storage, `documents/${selectedQuote.id}/${uploadFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, uploadFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (error) => {
        console.error('Upload error:', error);
        toast.error('Dosya yüklenirken hata oluştu!');
        setUploadProgress(0);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await updateDoc(doc(db, 'quotes', selectedQuote.id), {
            documentUrl: downloadURL,
            documentName: uploadFile.name,
            documentUploadDate: new Date(),
            documentUploadedBy: currentUser?.uid,
            awaitingProcessing: false,
            updatedAt: new Date()
          });

          if (selectedQuote.userId) {
            await sendNotificationToUser(selectedQuote.userId, 'document_ready', {
              quoteId: selectedQuote.id,
              insuranceType: selectedQuote.insuranceType,
              documentUrl: downloadURL,
              documentName: uploadFile.name
            });
          }

          toast.success('Belge başarıyla yüklendi ve kullanıcı bilgilendirildi!');
          setShowUploadModal(false);
          setUploadFile(null);
          setSelectedQuote(null);
          setUploadProgress(0);
        } catch (error) {
          console.error('Document update error:', error);
          toast.error('Belge kaydedilirken hata oluştu!');
        }
      }
    );
  };

  // ✅ Users refresh function - Real-time listener sayesinde otomatik
  const refreshUsers = () => {
    // console.log('🔄 Users refresh triggered (real-time listener handles this automatically)');
    toast.success('Kullanıcı listesi real-time güncellendi!');
  };

  // Password reset functions
  const handlePasswordResetComplete = async (request: any) => {
    try {
      await updateDoc(doc(db, 'passwordResetRequests', request.id), {
        status: 'completed',
        completedAt: new Date(),
        completedBy: currentUser?.uid
      });
      toast.success('Şifre sıfırlama talebi tamamlandı!');
    } catch (error) {
      console.error('Error completing password reset:', error);
      toast.error('İşlem tamamlanırken hata oluştu!');
    }
  };

  const handlePasswordResetCancel = async (request: any) => {
    try {
      await updateDoc(doc(db, 'passwordResetRequests', request.id), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: currentUser?.uid
      });
      toast.success('Şifre sıfırlama talebi iptal edildi!');
    } catch (error) {
      console.error('Error cancelling password reset:', error);
      toast.error('İşlem iptal edilirken hata oluştu!');
    }
  };

  // ✅ JSX RENDER
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
            {/* ✅ Mobile-responsive header */}
            <div className="space-y-4 mb-8">
              {/* Title and user greeting row */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Danışman Paneli</h1>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAudioToggle}
                      className={`p-2 rounded-lg transition ${audioSettings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      title={audioSettings.enabled ? 'Bildirim sesini kapat' : 'Bildirim sesini aç'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {audioSettings.enabled ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 9v6a3 3 0 11-6 0V9a3 3 0 116 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        )}
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setShowAudioSettingsModal(true)}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                      title="Ses ayarları"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    Hoş geldin, <span className="font-medium">{currentUser?.name} {currentUser?.surname}</span>
                  </div>
                </div>
              </div>

              {/* Status badges - mobile responsive grid */}
              <div className="flex flex-wrap gap-2">
                {/* ✅ Yeni Teklifler - Sadece pending ve aktif olanlar */}
                {newQuotesCount > 0 && (
                  <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{newQuotesCount} yeni teklif</span>
                  </div>
                )}
                
                {/* ✅ Kart Bilgisi Bekleyen - Sadece aktif olanlar */}
                {paidQuotesCount > 0 && (
                  <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{paidQuotesCount} kart bilgisi bekliyor</span>
                  </div>
                )}
                
                {/* ✅ Şifre Talepleri */}
                {pendingPasswordResets > 0 && (
                  <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{pendingPasswordResets} şifre talebi</span>
                  </div>
                )}
                
                {/* ✅ Toplam Aktif Teklifler - Bilgi amaçlı */}
                <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">Toplam: {totalActiveQuotes} aktif</span>
                </div>
                
                {/* ✅ İptal Edilmiş Teklifler - Eğer varsa göster */}
                {cancelledQuotesCount > 0 && (
                  <div className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium">{cancelledQuotesCount} iptal</span>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Mobile-responsive tab navigation */}
            <div className="mb-8">
              <div className="flex space-x-1 md:space-x-4 border-b overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`pb-4 px-2 md:px-4 relative whitespace-nowrap ${activeTab === 'quotes' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                >
                  <span className="text-sm md:text-base">Teklif Talepleri</span>
                  {/* ✅ Sadece aktif teklifler için rozet */}
                  {(newQuotesCount + paidQuotesCount) > 0 && (
                    <span className="absolute top-1 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-3 flex items-center justify-center">
                      {newQuotesCount + paidQuotesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('passwordResets')}
                  className={`pb-4 px-2 md:px-4 relative whitespace-nowrap ${activeTab === 'passwordResets' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                >
                  <span className="text-sm md:text-base">Şifre Talepleri</span>
                  {pendingPasswordResets > 0 && (
                    <span className="absolute top-1 -right-3 bg-black-500 text-white text-xs rounded-full w-5 h-3flex items-center justify-center">
                      {pendingPasswordResets}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`pb-4 px-2 md:px-4 relative whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                >
                  <span className="text-sm md:text-base">Kullanıcılar</span>
                  <span className="absolute top-1 -right-3 bg-blue-500 text-white text-xs rounded-full w-5 h-3 flex items-center justify-center">
                    {users.length}
                  </span>
                </button>
                {/* ✅ YENİ: Sosyal Medya Tab */}
                <button
                  onClick={() => setActiveTab('socialMedia')}
                  className={`pb-4 px-2 md:px-4 relative whitespace-nowrap ${activeTab === 'socialMedia' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                >
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm md:text-base">Sosyal Medya</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quotes Tab Content */}
            {activeTab === 'quotes' && (
              <div>
                {/* ✅ İstatistik Özeti */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{newQuotesCount}</div>
                    <div className="text-sm text-orange-700">Yeni Teklifler</div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{paidQuotesCount}</div>
                    <div className="text-sm text-yellow-700">Kart Bilgisi Bekleyen</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{completedQuotesCount}</div>
                    <div className="text-sm text-green-700">Tamamlanan</div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{cancelledQuotesCount}</div>
                    <div className="text-sm text-red-700">İptal Edilen</div>
                  </div>
                </div>

                {/* ✅ Aktif Teklifler Uyarısı */}
                {totalActiveQuotes === 0 && quotes.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-yellow-800">
                        <strong>Bilgi:</strong> Toplam {quotes.length} teklif var ancak hepsi iptal edilmiş durumda.
                      </span>
                    </div>
                  </div>
                )}

                {/* ✅ Hiç Teklif Yoksa */}
                {quotes.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg">Henüz teklif talebi bulunmamaktadır.</p>
                    <p className="text-gray-400 text-sm mt-2">Yeni teklifler buraya görünecektir.</p>
                  </div>
                )}

                {/* ✅ Teklifler Tablosu */}
                {quotes.length > 0 && (
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
                            quote.status === 'rejected' || quote.customerStatus === 'rejected' ? 'bg-red-50 border-red-200' :
                            quote.documentUrl ? 'bg-green-50 border-green-200' :
                            quote.customerStatus === 'card_submitted' && quote.awaitingProcessing ? 'bg-yellow-50 border-yellow-200' :
                            quote.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 
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

                                {/* ✅ İPTAL BUTONU - Sadece iptal edilmemiş ve belge yüklenmemiş teklifler için */}
                                {!isQuoteCancelled(quote) && !quote.documentUrl && (
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

                                {/* Sil Butonu - Her zaman görünür (admin yetkisi) */}
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

                                {/* ✅ CEVAPLA BUTONU - Sadece pending durumunda */}
                                {quote.status === 'pending' && !isQuoteCancelled(quote) && (
                                  <button
                                    onClick={() => handleQuoteResponse(quote)}
                                    className="text-green-600 hover:text-green-800 font-medium flex items-center space-x-1"
                                    title="Teklifi cevapla"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>Cevapla</span>
                                  </button>
                                )}
                                
                                {/* ✅ BELGE YÜKLE BUTONU - Sadece gerekli durumlarda göster */}
                                {shouldShowDocumentUpload(quote) && (
                                  <button
                                    onClick={() => handleDocumentUpload(quote)}
                                    className="text-green-600 hover:text-green-800 font-medium flex items-center space-x-1"
                                    title="Sigorta belgelerini yükle"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Belge Yükle</span>
                                  </button>
                                )}
                                
                                {/* WhatsApp Butonu - Her zaman görünür */}
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

                {/* ✅ DEBUG BİLGİSİ (Development ortamında) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                    <strong>Debug:</strong> Toplam: {quotes.length}, Aktif: {totalActiveQuotes}, 
                    Pending: {newQuotesCount}, Bekleyen: {paidQuotesCount}, 
                    Tamamlanan: {completedQuotesCount}, İptal: {cancelledQuotesCount}
                  </div>
                )}
              </div>
            )}

            {/* Password Resets Tab */}
            {activeTab === 'passwordResets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Şifre Sıfırlama Talepleri</h2>
                  <div className="text-sm text-gray-500">
                    Toplam {passwordResetRequests.length} talep • {pendingPasswordResets} beklemede
                  </div>
                </div>

                {passwordResetRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-gray-500 text-lg">Henüz şifre sıfırlama talebi bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {passwordResetRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className={`border rounded-lg p-6 flex items-center justify-between ${
                          request.status === 'pending' ? 'border-purple-200 bg-purple-50' :
                          request.status === 'completed' ? 'border-green-200 bg-green-50' :
                          'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-semibold text-gray-800">
                              {request.userName} {request.userSurname}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending' ? 'bg-purple-100 text-purple-800' :
                              request.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status === 'pending' ? '⏳ Beklemede' :
                               request.status === 'completed' ? '✅ Tamamlandı' :
                               '❌ İptal Edildi'}
                            </span>
                          </div>
                          

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Telefon:</span>
                              <a href={`tel:${request.phone}`} className="ml-2 text-purple-600 hover:text-purple-800">
                                {request.phone}
                              </a>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Talep Tarihi:</span>
                              <span className="ml-2 text-gray-800">
                                {request.requestDate?.toDate?.()?.toLocaleString('tr-TR') || 'N/A'}
                              </span>
                            </div>
                            {request.completedAt && (
                              <div>
                                <span className="font-medium text-gray-600">Tamamlanma:</span>
                                <span className="ml-2 text-gray-800">
                                  {request.completedAt?.toDate?.()?.toLocaleString('tr-TR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              window.open(`https://wa.me/90${request.phone.replace(/\D/g, '')}`, '_blank');
                            }}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            title="WhatsApp ile ara"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.75"/>
                            </svg>
                          </button>

                          <a
                            href={`tel:${request.phone}`}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            title="Telefon ara"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </a>

                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handlePasswordResetComplete(request)}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                title="Talebi tamamla"
                              >
                                ✅ Tamamla
                              </button>
                              <button
                                onClick={() => handlePasswordResetCancel(request)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                title="Talebi iptal et"
                              >
                                ❌ İptal
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <UsersComponent users={users} onUsersUpdate={refreshUsers} />
            )}

            {/* ✅ YENİ: Sosyal Medya Tab */}
            {activeTab === 'socialMedia' && (
              <SocialMediaManagement />
            )}
          </div>
        </div>

        {/* Modal Components */}
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

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          quote={selectedQuote}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedQuote(null);
          }}
          onConfirm={confirmDeleteQuote}
        />

        <RejectQuoteModal
          isOpen={showRejectModal}
          quote={selectedQuote}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedQuote(null);
          }}
          onConfirm={confirmRejectQuote}
        />

        {/* ✅ Audio Settings Modal */}
        {showAudioSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Bildirim Ses Ayarları</h3>
                <button
                  onClick={() => setShowAudioSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Bildirim Sesi</label>
                  <button
                    onClick={() => setAudioSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      audioSettings.enabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        audioSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Repeat Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tekrar Sayısı: {audioSettings.repeatCount} kez
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={audioSettings.repeatCount}
                    onChange={(e) => setAudioSettings(prev => ({ ...prev, repeatCount: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 kez</span>
                    <span>10 kez</span>
                  </div>
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ses Seviyesi: {Math.round(audioSettings.volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={audioSettings.volume}
                    onChange={(e) => setAudioSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Test Button */}
                <button
                  onClick={() => {
                    const testAudio = new Audio('/notification.mp3');
                    testAudio.volume = audioSettings.volume;
                    testAudio.play().catch(() => toast.error('Ses test edilemedi!'));
                  }}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  disabled={!audioSettings.enabled}
                >
                  🔊 Sesi Test Et
                </button>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAudioSettingsModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    saveAudioSettings(audioSettings);
                    setShowAudioSettingsModal(false);
                  }}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}