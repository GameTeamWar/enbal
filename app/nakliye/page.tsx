'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import LiveSupport from '@/app/components/LiveSupport';

export default function NakliyeSigortasi() {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">🚚 Nakliye Sigortası</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Taşınan mallarınızı her türlü riske karşı güvence altına alın
            </p>
            <button 
              onClick={() => setShowQuoteModal(true)}
              className="bg-white text-blue-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Nakliye Sigortası Nedir?</h3>
                  <p className="text-gray-600">
                    Nakliye sigortası, ürünlerin bir yerden başka bir yere taşınması sırasında oluşabilecek hasarları, kayıpları ve çalınmaları teminat altına alan özel bir sigorta türüdür.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Kimler Yaptırmalı?</h3>
                  <p className="text-gray-600">
                    İhracat-ithalat firmaları, üretici şirketler, lojistik firmaları, e-ticaret şirketleri ve değerli eşya taşıyan herkes nakliye sigortası yaptırmalıdır.
                  </p>
                </div>
              </div>

              {/* Nakliye Türleri */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Nakliye Sigortası Türleri</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center border border-blue-200 rounded-lg p-6">
                    <div className="text-3xl mb-4">🚛</div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-3">Kara Yolu Nakliyesi</h4>
                    <ul className="space-y-2 text-gray-600 text-sm text-left">
                      <li>✓ Kamyon ve TIR taşımacılığı</li>
                      <li>✓ Şehir içi teslimatlar</li>
                      <li>✓ Şehirlerarası taşımacılık</li>
                      <li>✓ Ağır yük taşımacılığı</li>
                    </ul>
                  </div>
                  <div className="text-center border border-blue-200 rounded-lg p-6 bg-blue-50">
                    <div className="text-3xl mb-4">🚢</div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-3">Deniz Yolu Nakliyesi</h4>
                    <ul className="space-y-2 text-gray-600 text-sm text-left">
                      <li>✓ Konteyner taşımacılığı</li>
                      <li>✓ Dökme yük taşımacılığı</li>
                      <li>✓ RoRo gemileri</li>
                      <li>✓ Uluslararası kargo</li>
                    </ul>
                  </div>
                  <div className="text-center border border-blue-200 rounded-lg p-6">
                    <div className="text-3xl mb-4">✈️</div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-3">Hava Yolu Nakliyesi</h4>
                    <ul className="space-y-2 text-gray-600 text-sm text-left">
                      <li>✓ Hızlı kargo teslimatı</li>
                      <li>✓ Değerli eşya taşımacılığı</li>
                      <li>✓ Hassas malzeme nakliyesi</li>
                      <li>✓ Express gönderimler</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Teminat Kapsamı */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Nakliye Sigortası Teminat Kapsamı</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Fiziki Hasarlar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Kaza Hasarları:</strong> Araç kazası sonucu mal hasarları
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Yangın ve Patlama:</strong> Taşıma sırasında yangın zararları
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Su Hasarı:</strong> Yağmur, sel, gemi batması
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Doğal Afetler:</strong> Deprem, fırtına, kasırga
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Güvenlik Riskleri</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Hırsızlık:</strong> Tam veya kısmi çalınma
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Soygun:</strong> Silahlı saldırı ve gasp
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Kaybolma:</strong> Mal kaybolması ve eksiklik
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Yanlış Teslimat:</strong> Hatalı adrese teslimat
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Özel Kargo Türleri */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Özel Nakliye Türleri</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Özel Kargolar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-3">💎</span>
                        <span><strong>Değerli Eşya:</strong> Mücevher, sanat eseri, antika</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-3">🏭</span>
                        <span><strong>Endüstriyel:</strong> Makine, ekipman, yedek parça</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-3">🧪</span>
                        <span><strong>Kimyasal:</strong> Tehlikeli madde taşımacılığı</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-blue-500 mr-3">🥘</span>
                        <span><strong>Gıda:</strong> Soğuk zincir ve özel ambalaj</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Özel Şartlar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">🌡️</span>
                        <span><strong>Sıcaklık Kontrolü:</strong> Soğutulmuş taşımacılık</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">📦</span>
                        <span><strong>Özel Ambalaj:</strong> Hassas mal paketleme</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">🛡️</span>
                        <span><strong>Eskort Hizmeti:</strong> Güvenlik eşliğinde taşıma</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">📍</span>
                        <span><strong>GPS Takip:</strong> Anlık konum bilgisi</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Faydalı Bilgiler */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Nakliye Sigortası İpuçları</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Doğru Değer Beyanı</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-orange-500 mr-2 mt-1">⚠️</span>
                        <span>Malın gerçek değerini beyan edin</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-500 mr-2 mt-1">⚠️</span>
                        <span>Fatura ve değer belgelerini saklayın</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-500 mr-2 mt-1">⚠️</span>
                        <span>Eksik beyan tazminatı azaltır</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Güvenli Paketleme</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <span>Uygun ambalaj malzemesi kullanın</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <span>Kırılabilir eşyaları özel işaretleyin</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <span>Su geçirmez ambalaj tercih edin</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Uzmanımızla Görüşün
                </h3>
                <p className="text-gray-600 mb-8">
                  Nakliye sigortası hakkında detaylı bilgi almak ve özel teklifler için hemen arayın.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="tel:+905354979353" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    📞 0535 497 93 53
                  </a>
                  <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="inline-block px-8 py-4 bg-white text-blue-700 border-2 border-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition"
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
          initialType="Nakliye"
        />
      )}
    </>
  );
}
