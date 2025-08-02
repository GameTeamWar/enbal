// app/konut-sigortasi/page.tsx - Fixed version with proper component
'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import LiveSupport from '@/app/components/LiveSupport';

export default function KonutSigortasi() {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">🏠 Konut Sigortası</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Evinizi ve içindeki değerlerinizi güvence altına alın
            </p>
            <button 
              onClick={() => setShowQuoteModal(true)}
              className="bg-white text-amber-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Konut Sigortası Nedir?</h3>
                  <p className="text-gray-600">
                    Konut sigortası, evinizi yangın, hırsızlık, doğal afet gibi risklere karşı koruyan ve içindeki eşyalarınızı güvence altına alan bir sigorta türüdür.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Kapsamı Nedir?</h3>
                  <p className="text-gray-600">
                    Evinizin yapısal kısmını, içindeki eşyaları, üçüncü şahıslara karşı sorumlulukları ve daha fazlasını kapsayan geniş bir koruma sağlar.
                  </p>
                </div>
              </div>

              {/* Kapsamlar */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Konut Sigortası Kapsamı</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-amber-600 mb-3">Yapı Teminatı</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Yangın hasarları</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Doğal afetler</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Su baskını</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Fırtına hasarları</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-amber-600 mb-3">Eşya Teminatı</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Mobilya ve eşyalar</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Elektronik cihazlar</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Kişisel eşyalar</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Hırsızlık koruması</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-amber-600 mb-3">Ek Teminatlar</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Kira kaybı</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Geçici konaklama</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Mali sorumluluk</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Cam kırılması</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Avantajlar */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Neden Konut Sigortası Yaptırmalısınız?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-amber-600 mb-3">Finansal Koruma</h4>
                    <p className="text-gray-600 mb-4">Beklenmedik olayların sebep olduğu maddi kayıplarınızı karşılar</p>
                    
                    <h4 className="text-lg font-semibold text-amber-600 mb-3">Huzur</h4>
                    <p className="text-gray-600">Ailenizin ve evinizdeki değerlerinizin güvende olduğunu bilerek huzur içinde yaşayın</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-amber-600 mb-3">Geniş Kapsam</h4>
                    <p className="text-gray-600 mb-4">Yangından hırsızlığa, doğal afetlerden su hasarlarına kadar geniş koruma</p>
                    
                    <h4 className="text-lg font-semibold text-amber-600 mb-3">Profesyonel Destek</h4>
                    <p className="text-gray-600">Hasar durumunda 7/24 eksper desteği ve hızlı hasar ödeme</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Uzmanımızla Görüşün
                </h3>
                <p className="text-gray-600 mb-8">
                  Konut sigortası hakkında detaylı bilgi almak ve teklif oluşturmak için hemen arayın.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="tel:+905354979353" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    📞 0535 497 93 53
                  </a>
                  <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="inline-block px-8 py-4 bg-white text-amber-600 border-2 border-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition"
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
          initialType="Konut"
        />
      )}
    </>
  )
}