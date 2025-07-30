// app/dask/page.tsx - Fixed version with proper component
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'DASK - Zorunlu Deprem Sigortası | Hızlı İşlem - Enbal Sigorta',
  description: 'DASK (Zorunlu Deprem Sigortası) için hemen başvurun. Online DASK poliçesi, hızlı işlem, uygun fiyat. Tarsus Mersin DASK temsilcisi.',
  keywords: ['DASK', 'deprem sigortası', 'zorunlu deprem sigortası', 'online dask', 'tarsus dask', 'mersin dask','enbal','en bal','en','sigorta','bal'],
  alternates: {
    canonical: 'https://enbalsigorta.com/dask',
  },
}


export default function DaskPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              DASK - Zorunlu Deprem Sigortası
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Zorunlu deprem sigortası (DASK) için hemen başvurun. Online işlem, hızlı poliçe düzenleme, 
              uygun fiyatlarla evinizi deprem riskine karşı güvence altına alın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                DASK Teklifi Al
              </button>*/}
              <a href="tel:+905354979353" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
                0535 497 93 53
              </a>
            </div>
          </div>
        </section>

         Content Section 
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                DASK Hakkında Bilmeniz Gerekenler
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">DASK Nedir?</h3>
                  <p className="text-gray-600">
                    DASK (Doğal Afet Sigortaları Kurumu), Türkiye'de zorunlu deprem sigortasıdır. 
                    Tüm konut sahipleri için yasal zorunluluktur ve evinizi deprem riskine karşı korur.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Kimler Yaptırmalı?</h3>
                  <p className="text-gray-600">
                    Tüm bina sahipleri, apartman yöneticileri ve ev sahipleri DASK yaptırmak zorundadır. 
                    Konut kredisi için de DASK zorunludur.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center">
                  DASK Avantajları
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Yasal Zorunluluk</h4>
                    <p className="text-gray-600 text-sm">Kanunla zorunlu tutulan deprem sigortası</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Uygun Fiyat</h4>
                    <p className="text-gray-600 text-sm">Devlet destekli uygun primler</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Hızlı İşlem</h4>
                    <p className="text-gray-600 text-sm">Online başvuru, anında poliçe</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  DASK İçin Hemen Başvurun
                </h3>
                <p className="text-gray-600 mb-8">
                  Uzman ekibimizle DASK poliçenizi kolayca düzenleyin. 
                  Tüm işlemlerinizi güvenle tamamlayın.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 {/* <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:opacity-90 transition">
                    Online DASK Başvurusu
                  </button>*/}
                  <a href="tel:+905354979353" className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition">
                    0535 497 93 53
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}