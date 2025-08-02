'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import LiveSupport from '@/app/components/LiveSupport';

export default function YanginSigortasi() {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">🔥 Yangın Sigortası</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              İşyerinizi ve mülkünüzü yangın risklerine karşı güvence altına alın
            </p>
            <button 
              onClick={() => setShowQuoteModal(true)}
              className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Yangın Sigortası Nedir?</h3>
                  <p className="text-gray-600">
                    Yangın sigortası, işyeri, fabrika, depo gibi ticari yapıları ve konutları yangın, patlama, yıldırım düşmesi gibi risklere karşı koruyan bir sigorta türüdür.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Kimler Yaptırmalı?</h3>
                  <p className="text-gray-600">
                    İşyeri sahipleri, fabrika sahipleri, depo işletmecileri ve değerli eşyaları olan konut sahipleri yangın sigortası yaptırmalıdır.
                  </p>
                </div>
              </div>

              {/* Yangın Sigortası Türleri */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Yangın Sigortası Türleri</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 mb-4">Konut Yangın Sigortası</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>Ev ve apartman dairelerini kapsar</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>Ev eşyaları teminatı dahil</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>Kira kaybı teminatı seçeneği</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>Geçici konaklama giderleri</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 mb-4">Ticari Yangın Sigortası</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>İşyeri ve fabrikaları kapsar</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>Makine ve teçhizat teminatı</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>İş durması teminatı</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <span>Stok ve emtia teminatı</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Teminat Kapsamı */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Yangın Sigortası Teminat Kapsamı</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">🔥</div>
                    <h4 className="text-lg font-semibold text-red-600 mb-3">Yangın Hasarları</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Açık alev hasarları</li>
                      <li>✓ Duman hasarları</li>
                      <li>✓ Söndürme masrafları</li>
                      <li>✓ Enkaz kaldırma</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-4">💥</div>
                    <h4 className="text-lg font-semibold text-red-600 mb-3">Patlama Hasarları</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Gaz patlaması</li>
                      <li>✓ Elektrik patlaması</li>
                      <li>✓ Buhar kazanı patlaması</li>
                      <li>✓ Kimyasal patlama</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-4">⚡</div>
                    <h4 className="text-lg font-semibold text-red-600 mb-3">Doğal Olaylar</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Yıldırım düşmesi</li>
                      <li>✓ Elektrik arkı</li>
                      <li>✓ Kısa devre</li>
                      <li>✓ Aşırı gerilim</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Ek Teminatlar */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Ek Teminatlar ve Avantajlar</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 mb-4">Ek Teminatlar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Sel ve Su Baskını:</strong> Doğal afet kaynaklı su hasarları
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Fırtına ve Kasırga:</strong> Şiddetli rüzgar hasarları
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Dolu Hasarı:</strong> Dolu düşmesi sonucu oluşan zararlar
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Kar Ağırlığı:</strong> Çatı çökmesi ve yapısal hasarlar
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 mb-4">Özel Avantajlar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>24/7 Hasar İhbar:</strong> Her an hasar ihbarı yapabilirsiniz
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Hızlı Ekspertiz:</strong> 48 saat içinde eksper ataması
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Yenileme Değeri:</strong> Değer kaybı olmadan tazminat
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Esnek Ödeme:</strong> Taksitli ödeme seçenekleri
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Risk Değerlendirmesi */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Yangın Riski Değerlendirmesi</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 mb-4">Yüksek Risk Sektörleri</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-red-500 mr-2">🔥</span> Kimya ve petrokimya</li>
                      <li className="flex items-center"><span className="text-red-500 mr-2">🔥</span> Ahşap işleme</li>
                      <li className="flex items-center"><span className="text-red-500 mr-2">🔥</span> Tekstil üretimi</li>
                      <li className="flex items-center"><span className="text-red-500 mr-2">🔥</span> Gıda işleme</li>
                      <li className="flex items-center"><span className="text-red-500 mr-2">🔥</span> Boyama ve vernik</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-600 mb-4">Koruyucu Önlemler</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center"><span className="text-green-500 mr-2">🛡️</span> Otomatik sprinkler sistemi</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">🛡️</span> Yangın alarm sistemi</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">🛡️</span> Güvenlik kameraları</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">🛡️</span> Yangın söndürücüleri</li>
                      <li className="flex items-center"><span className="text-green-500 mr-2">🛡️</span> Güvenlik görevlisi</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Uzmanımızla Görüşün
                </h3>
                <p className="text-gray-600 mb-8">
                  Yangın sigortası hakkında detaylı bilgi almak ve risk değerlendirmesi için hemen arayın.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="tel:+905354979353" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    📞 0535 497 93 53
                  </a>
                  <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="inline-block px-8 py-4 bg-white text-red-600 border-2 border-red-600 rounded-lg font-semibold hover:bg-red-50 transition"
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
          initialType="Yangın"
        />
      )}
    </>
  );
}
