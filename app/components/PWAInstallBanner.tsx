'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker kayıtlı:', registration.scope);
          
          // Update olup olmadığını kontrol et
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Service Worker güncellemesi bulundu');
          });
          
        } catch (error) {
          console.error('❌ Service Worker kayıt hatası:', error);
        }
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Tarayıcının varsayılan kurulum uyarısını engelle
      e.preventDefault();
      
      // Prompt'u sakla
      setDeferredPrompt(e);
      setShowInstallBanner(true);
      
      console.log('🔽 PWA kurulum uyarısı tetiklendi');
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA başarıyla kuruldu');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    // Event listener'ları ekle
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Eğer yakın zamanda reddedildiyse gösterme
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      if (dismissedTime > sevenDaysAgo) {
        setShowInstallBanner(false);
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Kurulum uyarısını göster
      deferredPrompt.prompt();
      
      // Kullanıcının tercihini bekle
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Kullanıcı PWA kurulumunu kabul etti');
      } else {
        console.log('❌ Kullanıcı PWA kurulumunu reddetti');
      }
      
      // Prompt'u temizle
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('PWA kurulum hatası:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // 7 gün sonra tekrar göster
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showInstallBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border-2 border-purple-300 rounded-lg shadow-xl p-4 z-50 pwa-banner-enter">
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            📱 Enbal Sigorta Uygulaması
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Hızlı erişim için uygulamayı telefonunuza kurmak ister misiniz?
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs py-2 px-3 rounded-lg hover:opacity-90 transition font-medium"
            >
              ✅ Kur
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg hover:bg-gray-300 transition"
            >
              ❌ Şimdi Değil
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
