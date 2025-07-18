// app/trafik-sigortasi/page.tsx - Trafik Sigortası Landing Page
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LiveSupport from '../components/LiveSupport'
import { useState } from 'react'

export const metadata: Metadata = {
  title: 'Trafik Sigortası | En Uygun Fiyatlar - Enbal Sigorta Tarsus Mersin',
  description: 'Trafik sigortası en uygun fiyatlarla! Zorunlu trafik sigortası için hemen teklif alın. Atlas, Sompo, Quick sigorta şirketleri ile anlaşmalı. 0535 497 93 53',
  keywords: ['trafik sigortası', 'zorunlu trafik sigortası', 'mtpl', 'araç sigortası', 'tarsus trafik sigortası', 'mersin trafik sigortası', 'online trafik sigortası'],
  alternates: {
    canonical: 'https://enbalsigorta.com/trafik-sigortasi',
  },
  openGraph: {
    title: 'Trafik Sigortası En Uygun Fiyatlarla | Enbal Sigorta',
    description: 'Zorunlu trafik sigortası için hemen teklif alın. Türkiye\'nin önde gelen sigorta şirketleri ile anlaşmalı. 15 yıllık deneyim.',
    url: 'https://enbalsigorta.com/trafik-sigortasi',
  },
}

export default function TrafikSigortasiPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Trafik Sigortası - En Uygun Fiyatlar
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Zorunlu trafik sigortası için hemen teklif alın. Online işlem, hızlı poliçe düzenleme, 
              uygun fiyatlarla aracınızı güvence altına alın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                Teklif Al
              </button>
              <a href="tel:+905354979353" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
                0535 497 93 53
              </a>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Trafik Sigortası Hakkında Bilmeniz Gerekenler
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Trafik Sigortası Nedir?</h3>
                  <p className="text-gray-600">
                    Trafik sigortası, araç sahipleri için yasal zorunluluktur. 
                    Trafik kazalarında 3. şahıslara verebileceğiniz zararları karşılar.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Kimler Yaptırmalı?</h3>
                  <p className="text-gray-600">
                    Tüm motorlu araç sahipleri trafik sigortası yaptırmak zorundadır. 
                    Bu sigorta olmadan araç kullanmak yasal değildir.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Hemen Trafik Sigortası Teklifi Alın
                </h3>
                <p className="text-gray-600 mb-8">
                  Uzman ekibimizle trafik sigortası poliçenizi kolayca düzenleyin. 
                  En uygun fiyatları karşılaştırın.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:opacity-90 transition">
                    Online Trafik Sigortası
                  </button>
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
