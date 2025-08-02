// app/trafik-sigortasi/page.tsx - Trafik Sigortası Landing Page
'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import LiveSupport from '@/app/components/LiveSupport';

export default function TrafikSigortasi() {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">🚗 Trafik Sigortası</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Yasal zorunluluk olan trafik sigortanızı hızlı ve uygun fiyatla yaptırın
            </p>
            <button 
              onClick={() => setShowQuoteModal(true)}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
            >
              Hemen Teklif Al
            </button>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              
              {/* Bilgi Kartları */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Trafik Sigortası Nedir?</h3>
                  <p className="text-gray-600">
                    Trafik sigortası, trafiğe çıkan her aracın yaptırması zorunlu olan ve üçüncü şahıslara verilecek hasarları karşılayan bir sigorta türüdür.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Neden Önemlidir?</h3>
                  <p className="text-gray-600">
                    Trafik sigortası, kaza durumunda karşı tarafa vereceğiniz zararlar için finansal koruma sağlar ve yasal bir zorunluluktur.
                  </p>
                </div>
              </div>

              {/* Kapsamlar */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Trafik Sigortası Kapsamı</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-3">Mal Hasarları</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Araç hasarları</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Bina ve yapı hasarları</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Eşya hasarları</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-3">Kişi Hasarları</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Vefat tazminatı</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Sürekli sakatlık</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Tedavi giderleri</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Avantajlar */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Enbal Sigorta Avantajları</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-3">⚡</div>
                    <h4 className="font-semibold mb-2">Hızlı İşlem</h4>
                    <p className="text-sm text-gray-600">Online teklif alın, 5 dakikada poliçenizi düzenleyin</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-3">💰</div>
                    <h4 className="font-semibold mb-2">En Uygun Fiyat</h4>
                    <p className="text-sm text-gray-600">Piyasanın en uygun fiyat garantisi</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-3">🛡️</div>
                    <h4 className="font-semibold mb-2">Güvenilir</h4>
                    <p className="text-sm text-gray-600">Lisanslı acentemizle güvenle çalışın</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Uzmanımızla Görüşün
                </h3>
                <p className="text-gray-600 mb-8">
                  Trafik sigortası hakkında detaylı bilgi almak ve teklif oluşturmak için hemen arayın.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="tel:+905354979353" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    📞 0535 497 93 53
                  </a>
                  <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="inline-block px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
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
          initialType="Trafik"
        />
      )}
    </>
  );
}
