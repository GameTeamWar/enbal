'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import LiveSupport from '@/app/components/LiveSupport';

export default function KaskoSigortasi() {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">🛡️ Kasko Sigortası</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Aracınızın değerini koruyun, her türlü riske karşı güvende olun
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Kasko Sigortası Nedir?</h3>
                  <p className="text-gray-600">
                    Kasko sigortası, aracınızın çarpma, çalınma, yangın, doğal afetler gibi risklere karşı korunmasını sağlayan gönüllü bir sigorta türüdür.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Neden Yaptırmalısınız?</h3>
                  <p className="text-gray-600">
                    Aracınızın değerini korumak ve oluşabilecek maddi kayıpları en aza indirmek için kasko sigortası yaptırmalısınız.
                  </p>
                </div>
              </div>

              {/* Kasko Türleri */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Kasko Sigorta Türleri</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="border border-blue-200 rounded-lg p-6 text-center">
                    <div className="text-3xl mb-4">🔹</div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-3">Mini Kasko</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Çarpışma hasarları</li>
                      <li>✓ Devrilme</li>
                      <li>✓ Yangın</li>
                      <li>✓ Doğal afetler</li>
                    </ul>
                  </div>
                  <div className="border border-purple-200 rounded-lg p-6 text-center bg-purple-50">
                    <div className="text-3xl mb-4">🔷</div>
                    <h4 className="text-lg font-semibold text-purple-600 mb-3">Genişletilmiş Kasko</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Mini kasko + </li>
                      <li>✓ Hırsızlık</li>
                      <li>✓ Cam hasarları</li>
                      <li>✓ Kısmi çalınma</li>
                    </ul>
                  </div>
                  <div className="border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-3xl mb-4">💎</div>
                    <h4 className="text-lg font-semibold text-green-600 mb-3">Tam Kasko</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>✓ Tüm riskler</li>
                      <li>✓ Yedek parça garantisi</li>
                      <li>✓ Yol yardımı</li>
                      <li>✓ İkame araç</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Kapsamlar */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Kasko Sigortası Kapsamı</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Temel Teminatlar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Çarpışma ve Çarpma:</strong> Başka araçlarla veya sabit cisimlerle çarpışma
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Devrilme:</strong> Aracın devrilmesi sonucu oluşan hasarlar
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Yangın:</strong> Yangın, patlama ve yıldırım hasarları
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Doğal Afetler:</strong> Sel, fırtına, dolu gibi doğal olaylar
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-600 mb-4">Ek Teminatlar</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Hırsızlık:</strong> Aracın tamamen çalınması durumu
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Cam Hasarları:</strong> Ön, yan ve arka cam kırılmaları
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>Yol Yardımı:</strong> 7/24 çekici ve yol yardımı hizmeti
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">✓</span>
                        <div>
                          <strong>İkame Araç:</strong> Hasar süresi boyunca yedek araç
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Avantajlar */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Enbal Sigorta Kasko Avantajları</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-3">🏆</div>
                    <h4 className="font-semibold mb-2">Anlaşmalı Servisler</h4>
                    <p className="text-sm text-gray-600">Türkiye geneli 1000+ anlaşmalı servis ağı</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-3">⚡</div>
                    <h4 className="font-semibold mb-2">Hızlı Hasar Ödeme</h4>
                    <p className="text-sm text-gray-600">Hasar tespiti sonrası 48 saat içinde ödeme</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-3">📱</div>
                    <h4 className="font-semibold mb-2">Mobil Ekspertiz</h4>
                    <p className="text-sm text-gray-600">Mobil ekspertiz ile hızlı hasar tespiti</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Uzmanımızla Görüşün
                </h3>
                <p className="text-gray-600 mb-8">
                  Kasko sigortası hakkında detaylı bilgi almak ve teklif oluşturmak için hemen arayın.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="tel:+905354979353" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:opacity-90 transition"
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
          initialType="Kasko"
        />
      )}
    </>
  )
}