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

export default function TrafikSigortasi() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Trafik Sigortası En Uygun Fiyatlarla
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Zorunlu trafik sigortası için hemen teklif alın. Türkiye'nin önde gelen sigorta şirketleri ile 
              anlaşmalı olarak en uygun fiyatları sunuyoruz. 15 yıllık deneyim, güvenilir hizmet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                Hemen Teklif Al
              </button>
              <a href="tel:+905354979353" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
                0535 497 93 53
              </a>
            </div>
          </div>
        </section>

        {/* Content sections... */}
        
      </main>
      <Footer />
    </>
  )
}
