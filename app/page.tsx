// app/page.tsx - SEO Optimized Homepage
'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Footer from './components/Footer';
import Image from 'next/image';

// Page-specific metadata would be in a separate metadata export if this wasn't a client component
export default function Home() {
  const [currentCompanySlide, setCurrentCompanySlide] = useState(0);

  const companies = [
    { name: 'Atlas Sigorta', logo: '/logos/atlas.png' },
    { name: 'Hepiyi Sigorta', logo: '/logos/hepiyi.png' },
    { name: 'Koru Sigorta', logo: '/logos/koru.png' },
    { name: 'Orient Sigorta', logo: '/logos/orient.png' },
    { name: 'Quick Sigorta', logo: '/logos/quick.png' },
    { name: 'Sompo Sigorta', logo: '/logos/sompo.png' },
    { name: 'Türk Nippon Sigorta', logo: '/logos/türknipon.png' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCompanySlide((prev) => (prev + 1) % companies.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [companies.length]);

  return (
    <>
      {/* SEO: Page Title and Meta for Client Component */}
      <title>Enbal Sigorta - Trafik, Kasko, Konut, DASK Sigortası | Adana Tarsus</title>
      
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Hero Section with SEO optimized content */}
        <Hero />
        
        {/* Services Section with SEO optimized content */}
        <Services />
        
        {/* About Section - SEO Optimized */}
        <section id="about" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Enbal Sigorta Hakkında - 25 Yıllık Deneyim
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                2000 yılından bu yana Tarsus Mersin'de sigorta sektöründe güvenilir hizmet sunan Enbal Sigorta, 
                müşteri memnuniyetini ön planda tutarak sektördeki deneyimini sizlerle paylaşmaktadır. 
                Türkiye'nin önde gelen sigorta şirketleri ile anlaşmalı olarak en uygun fiyatları sunuyoruz.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                {/* Geçici olarak div kullanımı - kendi resminizi ekleyin */}
                <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">En&bal Sigorta</h3>
                    <p className="text-gray-600">Mersin, Adana ve Türkiye İl Ve İlçelerinde Hizmetinizde</p>
                  </div>
                </div>
                {/* 
                Kendi resminizi eklemek için:
                <Image 
                  src="/img/ofis.webp"
                  alt="Enbal Sigorta Adana Tarsus Ofisi - Sigorta Danışmanları" 
                  width={600}
                  height={400}
                  className="w-full rounded-2xl shadow-xl"
                  priority={false}
                />
                */}
              </div>
              <div className="space-y-6">
                <article className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Güvenilir Sigorta Hizmeti</h3>
                    <p className="text-gray-600">
                      25 yıllık deneyimimizle  Mersin, Adana Ve Türkiye il ve ilçelerinde en uygun sigorta çözümlerini sunuyoruz. 
                      Trafik sigortası, kasko, konut sigortası ve DASK için uzman ekibimizle hizmetinizdeyiz.
                    </p>
                  </div>
                </article>
                
                <article className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">7/24 Sigorta Destek Hattı</h3>
                   <p className="text-gray-600">
  Acil durumlarınızda yanınızdayız. Trafik kazası, hasar durumları ve tüm sigorta işlemleriniz için
  her zaman ulaşabileceğiniz destek hattımız:{" "}
  <a href="tel:05354979353" className="text-blue-600 hover:underline">
    0535 497 93 53
  </a>
</p>

                  </div>
                </article>
                
                <article className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Hızlı Online Sigorta İşlemleri</h3>
                    <p className="text-gray-600">
                      Dijital altyapımızla tüm sigorta işlemlerinizi hızlı ve güvenli şekilde tamamlayın. 
                      Online teklif alabilir, sigorta poliçenizi anında düzenleyebilirsiniz.
                    </p>
                  </div>
                </article>
                
                <article className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">En Uygun Sigorta Fiyatları</h3>
                    <p className="text-gray-600">
                      Atlas, Sompo, Quick, Orient ve tüm büyük sigorta şirketleri ile anlaşmalı olarak 
                      en uygun fiyatları sunuyoruz. Fiyat karşılaştırması ile en ekonomik seçeneği bulun.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Companies Section - SEO Optimized */}
        <section className="py-16 bg-gray-100" aria-label="Anlaşmalı Sigorta Şirketleri">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Anlaşmalı Sigorta Şirketlerimiz
              </h2>
              <p className="text-xl text-gray-600">
                Türkiye'nin önde gelen sigorta şirketleri ile çalışarak size en uygun seçenekleri sunuyoruz
              </p>
            </div>
            
            <div className="relative bg-white rounded-2xl shadow-xl p-8 overflow-hidden">
              <div className="flex items-center justify-center h-32">
                <div className="w-full max-w-xs">
                  <Image 
                    src={companies[currentCompanySlide].logo}
                    alt={`${companies[currentCompanySlide].name} - Enbal Sigorta Anlaşmalı Şirket`}
                    width={200}
                    height={80}
                    className="w-full h-20 object-contain transition-all duration-500"
                    priority={false}
                  />
                </div>
              </div>
              
              {/* Slide Navigation Dots */}
              <div className="flex justify-center space-x-2 mt-6">
                {companies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCompanySlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentCompanySlide ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                    aria-label={`${companies[index].name} sigorta şirketi`}
                  />
                ))}
              </div>
              
              {/* Company Grid */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
                {companies.map((company, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-center p-4 bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer ${
                      index === currentCompanySlide ? 'ring-2 ring-purple-600 bg-purple-50' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentCompanySlide(index)}
                    title={`${company.name} ile sigorta yaptırın`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                        <Image 
                          src={company.logo} 
                          alt={`${company.name} Logo`}
                          width={64}
                          height={64}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{company.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  <strong>Anlaşmalı Şirketler:</strong> Atlas Sigorta, Sompo Sigorta, Quick Sigorta, Orient Sigorta, 
                  Koru Sigorta, Hepiyi Sigorta, Türk Nippon Sigorta ve daha fazlası...
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section - SEO Optimized */}
        <section id="contact" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                En&bal Sigorta İletişim Bilgileri
              </h2>
              <p className="text-xl text-gray-600">
                Adana Tarsus'ta sigorta hizmetleri için bizimle iletişime geçin. Hemen teklif alın!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <address className="text-center not-italic">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">7/24 Sigorta Destek Telefonu</h3>
                <a href="tel:+905354979353" className="text-purple-600 hover:text-purple-700 block font-semibold">
                  0535 497 93 53
                </a>
                <a href="tel:+903246130300" className="text-purple-600 hover:text-purple-700 block">
                  0324 613 03 00
                </a>
                <p className="text-sm text-gray-500 mt-2">Trafik kazası, hasar bildirimi, genel bilgi</p>
              </address>
              
              <address className="text-center not-italic">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Enbal Sigorta Adres</h3>
                <p className="text-gray-600">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=36.918030,34.896987"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    title="Enbal Sigorta Tarsus Ofisini Haritada görüntüle"
                  >
                    Kızılmurat Mh. Ali Menteşoğlu Caddesi<br />
                    Bengi Apt altı No: z-1<br />
                    Tarsus / Mersin
                  </a>
                </p>
                <p className="text-sm text-gray-500 mt-2">Merkez ofisimizden hizmet alabilirsiniz</p>
              </address>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Çalışma Saatleri</h3>
                <div className="text-gray-600">
                  <p><strong>Pazartesi - Cumartesi</strong></p>
                  <p>09:00 - 18:00</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>Acil Durum:</strong> 7/24 telefon desteği (pazar günü de dahil)
                  </p>
                </div>
              </div>
            </div>
            
           
          </div>
        </section>
        
        <Footer />
      </main>
    </>
  );
}