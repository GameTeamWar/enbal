// app/layout.tsx - SEO Optimized Version with Bottom-Right Toast
'use client';

import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { useEffect } from 'react'
import { initConsoleSecurityGuard, detectDevTools } from '@/lib/console-security'
import { preventRightClick, hideSourceCode } from '@/lib/security-utils'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ Console güvenlik önlemleri
  useEffect(() => {
    // Console security guard'ı başlat
    initConsoleSecurityGuard();
    
    // DevTools tespit etme
    detectDevTools();
    
    // ✅ Ek güvenlik önlemleri (sadece production'da)
    if (process.env.NODE_ENV === 'production') {
      preventRightClick();
      hideSourceCode();
      
      // Sayfa yenilenme uyarısı
      window.addEventListener('beforeunload', (e) => {
        if (window.location.pathname.includes('/admin') || 
            window.location.pathname.includes('/profile')) {
          e.preventDefault();
          e.returnValue = 'Çıkmak istediğinizden emin misiniz?';
        }
      });
    }

    // ✅ Client-side metadata management (since we can't use export metadata)
    document.title = 'Enbal Sigorta - Trafik, Kasko, Konut, DASK Sigortası - En Uygun Fiyatlar';
    
    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Enbal Sigorta ile trafik, kasko, konut, DASK sigortası için en uygun fiyatları karşılaştırın. Hızlı teklif alın, güvenli sigorta hizmeti.');
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const keywords = document.createElement('meta');
      keywords.name = 'keywords';
      keywords.content = 'sigorta, trafik sigortası, kasko, konut sigortası, DASK, sigorta teklifi, enbal sigorta';
      document.head.appendChild(keywords);
    }

    // Open Graph tags
    const updateMetaProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaProperty('og:title', 'Enbal Sigorta - En Uygun Sigorta Fiyatları');
    updateMetaProperty('og:description', 'Trafik, kasko, konut ve DASK sigortası için en uygun fiyatları karşılaştırın.');
    updateMetaProperty('og:type', 'website');
    updateMetaProperty('og:url', window.location.origin);
    updateMetaProperty('og:site_name', 'Enbal Sigorta');

    // Twitter Card tags
    const updateTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateTwitterMeta('twitter:card', 'summary_large_image');
    updateTwitterMeta('twitter:title', 'Enbal Sigorta - En Uygun Sigorta Fiyatları');
    updateTwitterMeta('twitter:description', 'Trafik, kasko, konut ve DASK sigortası için en uygun fiyatları karşılaştırın.');

  }, []);

  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Enbal Sigorta ile trafik, kasko, konut, DASK sigortası için en uygun fiyatları karşılaştırın. Hızlı teklif alın, güvenli sigorta hizmeti." />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Enbal Sigorta" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <title>Enbal Sigorta - Trafik, Kasko, Konut, DASK Sigortası - En Uygun Fiyatlar</title>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster 
          position="bottom-left"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}