import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kasko Sigortası | Mini, Tam Kasko Seçenekleri - Enbal Sigorta',
  description: 'Kasko sigortası ile aracınızı her türlü riske karşı koruyun. Mini kasko, genişletilmiş kasko, tam kasko seçenekleri. En uygun fiyatlar için 0535 497 93 53',
  keywords: ['kasko sigortası', 'tam kasko', 'mini kasko', 'araç kaskosu', 'adana kasko', 'tarsus kasko', 'kasko fiyatları'],
  alternates: {
    canonical: 'https://enbalsigorta.com/kasko-sigortasi',
  },
}

export default function KaskoSigortasi() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Kasko Sigortası - Aracınızı Tam Güvence Altına Alın
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Mini kasko, genişletilmiş kasko ve tam kasko seçenekleriyle aracınızı her türlü riske karşı koruyun.
            </p>
            <a 
              href="tel:+905354979353" 
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              0535 497 93 53
            </a>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Kasko Sigortası Hakkında
              </h2>
              
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

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Uzmanımızla Görüşün
                </h3>
                <p className="text-gray-600 mb-8">
                  Kasko sigortası hakkında detaylı bilgi almak ve teklif oluşturmak için hemen arayın.
                </p>
                <a 
                  href="tel:+905354979353" 
                  className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  0535 497 93 53
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}