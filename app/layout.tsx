// app/layout.tsx - SEO Optimized Version with Bottom-Right Toast
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Enbal Sigorta - Trafik, Kasko, Konut, DASK Sigortası - En Uygun Fiyatlar',
    template: '%s | Enbal Sigorta'
  },
  description: 'Enbal Sigorta ile trafik, kasko, konut, DASK, yangın ve nakliye sigortası için en uygun fiyatları alın. 25 yıllık deneyim, 7/24 destek, hızlı işlem garantisi. Tarsus Mersin.',
  keywords: [
     'sigorta',
    'trafik sigortası',
    'kasko sigortası', 
    'konut sigortası',
    'DASK',
    'yangın sigortası',
    'nakliye sigortası',
    'Adana sigorta',
    'Tarsus sigorta',
    'Mersin sigorta',
    'Türkiye sigorta',
    'İstanbul sigorta',
    'Ankara sigorta',
    'sigorta acentesi',
    'sigorta fiyatları',
    'sigorta teklifi',
    'sigorta kampanyaları',
    'hızlı sigorta',
    'acil sigorta',
    'sigorta danışmanlığı',
    'sigorta hizmetleri',
    'sigorta poliçesi',
    'online sigorta',
    'sigorta teklifi',
    'sigorta acentesi',
    'pazar günü açık sigorta',
    'sigorta müşteri hizmetleri',
    'sigorta destek hattı',
    'sigorta hasar işlemleri',
    'sigorta yenileme',
    'sigorta fiyat karşılaştırma',
    'Hafta sonu açık sigorta',
    'uygun sigorta',
    'yol yardım sigortası',
    'hızlı sigorta'
  ],
  authors: [{ name: 'Enbal Sigorta' }],
  creator: 'Enbal Sigorta',
  publisher: 'Enbal Sigorta',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://enbalsigorta.com',
    siteName: 'Enbal Sigorta',
    title: 'Enbal Sigorta - Güvenli Yarınlar İçin Doğru Adres',
    description: 'Türkiye\'nin önde gelen sigorta şirketleri ile çalışan Enbal Sigorta\'dan trafik, kasko, konut sigortası ve daha fazlası. 15 yıllık deneyim, 7/24 destek. Tarsus Mersin.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Enbal Sigorta - Güvenli Yarınlar İçin Doğru Adres',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enbal Sigorta - Güvenli Yarınlar İçin Doğru Adres',
    description: 'Trafik, kasko, konut sigortası ve daha fazlası için en uygun fiyatları alın. 15 yıllık deneyim, güvenilir hizmet.',
    images: ['/twitter-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://enbalsigorta.com',
  },
  verification: {
    google: 'google-verification-code-buraya',
    yandex: 'yandex-verification-code-buraya',
  },
  category: 'insurance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Explicit favicon link to avoid conflicts */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Geo Tags */}
        <meta name="geo.region" content="TR-33" />
        <meta name="geo.placename" content="Tarsus, Mersin" />
        <meta name="geo.position" content="36.918030;34.896987" />
        <meta name="ICBM" content="36.918030, 34.896987" />
        
        {/* Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "InsuranceAgency",
              "name": "Enbal Sigorta",
              "description": "Türkiye'nin önde gelen sigorta şirketleri ile çalışan güvenilir sigorta acentesi",
              "url": "https://enbalsigorta.com",
              "logo": "https://enbalsigorta.com/logos/logo.png",
              "image": "https://enbalsigorta.com/og-image.jpg",
              "telephone": ["+905354979353", "+903246130300"],
              "email": "info@enbalsigorta.com",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Kızılmurat Mh. Ali Menteşoğlu Caddesi Bengi Apt altı No: z-1",
                "addressLocality": "Tarsus",
                "addressRegion": "Mersin",
                "postalCode": "33400",
                "addressCountry": "TR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 36.918030,
                "longitude": 34.896987
              },
              "openingHours": "Mo-Sa 09:00-18:00",
              "areaServed": [
                {
                  "@type": "State",
                  "name": "Mersin"
                },
                {
                  "@type": "City", 
                  "name": "Tarsus"
                },
                {
                  "@type": "State",
                  "name": "Adana"
                }
              ],
              "serviceType": [
                "Trafik Sigortası",
                "Kasko Sigortası", 
                "Konut Sigortası",
                "DASK",
                "Yangın Sigortası",
                "Nakliye Sigortası"
              ],
              "foundingDate": "2010",
              "slogan": "Güvenli Yarınlar İçin Doğru Adres",
              "sameAs": [
                "https://www.facebook.com/enbalsigorta",
                "https://www.instagram.com/enbalsigorta",
                "https://www.linkedin.com/company/enbalsigorta"
              ]
            }),
          }}
        />
        
        {/* Services Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "serviceType": "Insurance Services",
              "provider": {
                "@type": "InsuranceAgency",
                "name": "Enbal Sigorta"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Sigorta Hizmetleri",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Trafik Sigortası",
                      "description": "Zorunlu trafik sigortası ile aracınızı güvence altına alın"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Kasko Sigortası",
                      "description": "Aracınızı her türlü riske karşı koruyun"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "Konut Sigortası",
                      "description": "Evinizi yangın, hırsızlık ve doğal afetlere karşı sigortalayın"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "DASK",
                      "description": "Zorunlu deprem sigortası"
                    }
                  }
                ]
              }
            }),
          }}
        />

        {/* Google Analytics (placeholder) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID');
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Browser extension attribute cleanup
              (function() {
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes') {
                      const target = mutation.target;
                      if (target.nodeType === 1) {
                        const extensionAttrs = [
                          'cz-shortcut-listen',
                          'data-new-gr-c-s-check-loaded',
                          'data-gr-ext-installed',
                          'spellcheck'
                        ];
                        extensionAttrs.forEach(attr => {
                          if (target.hasAttribute(attr)) {
                            target.removeAttribute(attr);
                          }
                        });
                      }
                    }
                  });
                });
                
                if (typeof window !== 'undefined') {
                  document.addEventListener('DOMContentLoaded', function() {
                    observer.observe(document.body, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['cz-shortcut-listen', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed']
                    });
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className={inter.className}
        suppressHydrationWarning
      >
        {children}
        {/* ✅ Toast notification'ları sol aşağıda konumlandır */}
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
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}