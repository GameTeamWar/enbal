// app/dask/page.tsx - Fixed version with proper component
'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import LiveSupport from '@/app/components/LiveSupport';

export default function DaskPage() {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-green-600 to-teal-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">🏢 DASK (Zorunlu Deprem Sigortası)</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Evinizi deprem riskine karşı yasal zorunlulukla güvence altına alın
            </p>
            <button 
              onClick={() => setShowQuoteModal(true)}
              className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
            >
              Hemen Teklif Al
            </button>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              
              {/* DASK Nedir? */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">DASK Nedir?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-gray-600 mb-6">
                      <strong>DASK (Doğal Afet Sigortaları Kurumu)</strong>, Türkiye'de yaşanan depremlerin sebep olduğu hasarları 
                      karşılamak amacıyla kurulan zorunlu bir sigorta sistemidir.
                    </p>
                    <p className="text-gray-600">
                      27 Aralık 1999 tarihinde yürürlüğe giren yasa ile konut sahipleri için zorunlu hale getirilmiştir.
                    </p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800 mb-3">Önemli Bilgi</h4>
                    <p className="text-green-700 text-sm">
                      DASK, sadece konutları kapsar ve deprem hasarlarını teminat altına alır. 
                      İş yerleri ve diğer yapılar DASK kapsamında değildir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kimler Yaptırmak Zorunda */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Kimler DASK Yaptırmak Zorunda?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-green-600 mb-4">Zorunlu Durumlar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-red-500 mr-3 mt-1">⚠️</span>
                        <span>Belediye sınırları içindeki bağımsız konutlar</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-3 mt-1">⚠️</span>
                        <span>Apartman daireleri</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-3 mt-1">⚠️</span>
                        <span>Site içindeki konutlar</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-3 mt-1">⚠️</span>
                        <span>Yazlık ve kış evleri</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-600 mb-4">Ne Zaman Gerekli?</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-3 mt-1">📋</span>
                        <span>Konut satış işlemlerinde</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-3 mt-1">📋</span>
                        <span>Kredi başvurularında</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-3 mt-1">📋</span>
                        <span>Resmi kurumlarla işlemlerde</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-3 mt-1">📋</span>
                        <span>Elektrik, su, doğalgaz bağlantılarında</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Teminat Kapsamı */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">DASK Teminat Kapsamı</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">🏠</div>
                    <h4 className="text-lg font-semibold text-green-600 mb-3">Yapı Hasarları</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Duvar çatlakları</li>
                      <li>✓ Yapısal hasarlar</li>
                      <li>✓ Çatı hasarları</li>
                      <li>✓ Temel sorunları</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-4">🛋️</div>
                    <h4 className="text-lg font-semibold text-green-600 mb-3">Eşya Hasarları</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Mobilyalar</li>
                      <li>✓ Beyaz eşyalar</li>
                      <li>✓ Elektronik cihazlar</li>
                      <li>✓ Kişisel eşyalar</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-4">🏨</div>
                    <h4 className="text-lg font-semibold text-green-600 mb-3">Ek Masraflar</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Geçici konaklama</li>
                      <li>✓ Enkaz kaldırma</li>
                      <li>✓ Yıkım giderleri</li>
                      <li>✓ Hasar tespit giderleri</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* DASK Limitleri */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">2024 DASK Teminat Limitleri</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-lg font-semibold text-green-600 mb-4">Yapı Teminatı</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Minimum:</span>
                        <span className="font-semibold">25.000 TL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maksimum:</span>
                        <span className="font-semibold">610.000 TL</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-lg font-semibold text-green-600 mb-4">Eşya Teminatı</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Oran:</span>
                        <span className="font-semibold">Yapının %20'si</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maksimum:</span>
                        <span className="font-semibold">122.000 TL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DASK Yaptırmamanın Sonuçları */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-red-800 mb-6 text-center">⚠️ DASK Yaptırmamanın Sonuçları</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">❌</span>
                      <span className="text-red-700">Konut satış işlemi yapılamaz</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">❌</span>
                      <span className="text-red-700">Kredi çekilemez</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">❌</span>
                      <span className="text-red-700">Elektrik aboneliği alınamaz</span>
                    </li>
                  </ul>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">❌</span>
                      <span className="text-red-700">Su ve doğalgaz bağlanamaz</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">❌</span>
                      <span className="text-red-700">Yapı ruhsatı alınamaz</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">❌</span>
                      <span className="text-red-700">Deprem hasarları karşılanmaz</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Uzmanımızla Görüşün
                </h3>
                <p className="text-gray-600 mb-8">
                  DASK hakkında detaylı bilgi almak ve teklif oluşturmak için hemen arayın.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="tel:+905354979353" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    📞 0535 497 93 53
                  </a>
                  <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="inline-block px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
                  >
                    📋 Online Teklif Al
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
      {showQuoteModal && (
        <LiveSupport 
          onClose={() => setShowQuoteModal(false)}
          initialType="DASK"
        />
      )}
    </>
  )
}