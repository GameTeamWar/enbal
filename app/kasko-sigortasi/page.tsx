import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

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
        <h1 className="text-4xl font-bold text-center py-16">
          Kasko Sigortası - Aracınızı Tam Güvence Altına Alın
        </h1>
        {/* Content... */}
      </main>
      <Footer />
    </>
  )
}