// app/konut-sigortasi/page.tsx - Fixed version with proper component
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'Konut Sigortası | Ev, Yangın, Hırsızlık Sigortası - Enbal Sigorta',
  description: 'Konut sigortası ile evinizi yangın, hırsızlık, doğal afetlere karşı sigortalayın. Ev sigortası en uygun fiyatlarla. Tarsus Mersin bölgesinde hizmet.',
  keywords: ['konut sigortası', 'ev sigortası', 'yangın sigortası', 'hırsızlık sigortası', 'ev güvencesi', 'tarsus konut sigortası', 'mersin konut sigortası'],
  alternates: {
    canonical: 'https://enbalsigorta.com/konut-sigortasi',
  },
}

export default function KonutSigortasi() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-green-600 to-blue-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Konut Sigortası - Evinizi Tam Güvence Altına Alın
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Konut sigortası ile evinizi yangın, hırsızlık, doğal afetler ve su hasarına karşı koruyun. 
              Kapsamlı teminatlar, uygun fiyatlar, güvenilir hizmet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <button className="px-8 py-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                Konut Sigortası Teklifi Al
              </button>*/}
              <a href="tel:+905354979353" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-green-600 transition">
                0535 497 93 53
              </a>
            </div>
          </div>
        </section>

      Content sections 
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
                Konut Sigortası Teminatları
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Yangın Teminatı</h3>
                  <p className="text-gray-600">Yangın, patlama, yıldırım düşmesi gibi risklere karşı tam koruma</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Doğal Afet</h3>
                  <p className="text-gray-600">Sel, su baskını, fırtına gibi doğal afetlere karşı güvence</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Hırsızlık Teminatı</h3>
                  <p className="text-gray-600">Hırsızlık, soygun, gasp olaylarında mali koruma</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Eşya Sigortası</h3>
                  <p className="text-gray-600">Mobilya, elektronik eşya ve kişisel eşyalarınız güvende</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Sorumluluk</h3>
                  <p className="text-gray-600">Üçüncü şahıslara karşı mali sorumluluk teminatı</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Cam Kırılması</h3>
                  <p className="text-gray-600">Cam, ayna, vitrin kırılmalarında hasar teminatı</p>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Neden Enbal Sigorta?
                </h3>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">15 Yıllık Deneyim</h4>
                    <p className="text-gray-600 text-sm">Sektördeki uzun yılların getirdiği güven</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">En Uygun Fiyatlar</h4>
                    <p className="text-gray-600 text-sm">Türkiye'nin önde gelen sigorta şirketleri ile anlaşmalı</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Hızlı İşlem</h4>
                    <p className="text-gray-600 text-sm">Online başvuru, anında poliçe düzenleme</p>
                  </div>
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