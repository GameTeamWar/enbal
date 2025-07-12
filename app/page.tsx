'use client';

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Footer from './components/Footer';
import Image from 'next/image';

export default function Home() {
  const [currentCompanySlide, setCurrentCompanySlide] = useState(0);

  const companies = [
  { name: '', logo: '/logos/atlas.png' },
  { name: '', logo: '/logos/hepiyi.png' },
  { name: '', logo: '/logos/koru.png' },
  { name: '', logo: '/logos/orient.png' },
  { name: '', logo: '/logos/quick.png' },
  { name: '', logo: '/logos/sompo.png' },
  { name: '', logo: '/logos/türknipon.png' }
];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCompanySlide((prev) => (prev + 1) % companies.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [companies.length]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero />
      <Services />
      
      {/* Hakkımızda Bölümü */}
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Hakkımızda</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              2010 yılından bu yana sigorta sektöründe güvenilir hizmet sunan Enbal Sigorta, 
              müşteri memnuniyetini ön planda tutarak sektördeki deneyimini sizlerle paylaşmaktadır.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://img.freepik.com/free-photo/about-as-service-contact-information-concept_53876-138509.jpg"  alt="Enbal Sigorta Ofisi" 
                className="w-full rounded-2xl shadow-xl"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Güvenilir Hizmet</h3>
                  <p className="text-gray-600">15 yıllık deneyimimizle en uygun sigorta çözümlerini sunuyoruz.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">7/24 Destek</h3>
                  <p className="text-gray-600">Acil durumlarınızda yanınızdayız. Her zaman ulaşabileceğiniz destek hattımız.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Hızlı İşlem</h3>
                  <p className="text-gray-600">Dijital altyapımızla tüm işlemlerinizi hızlı ve güvenli şekilde tamamlayın.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Uygun Fiyat</h3>
                  <p className="text-gray-600">Tüm sigorta şirketleri ile anlaşmalı olarak en uygun fiyatları sunuyoruz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Firmalarımız Bölümü */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Firmalarımız</h2>
            <p className="text-xl text-gray-600">Türkiye'nin önde gelen sigorta şirketleri ile çalışıyoruz</p>
          </div>
          
          <div className="relative bg-white rounded-2xl shadow-xl p-8 overflow-hidden">
            <div className="flex items-center justify-center h-32">
              <div className="w-full max-w-xs">
                <img 
                  src={companies[currentCompanySlide].logo}
                  alt={companies[currentCompanySlide].name}
                  className="w-full h-20 object-contain transition-all duration-500"
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
                />
              ))}
            </div>
            
            {/* Company Grid - Alternative Display */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {companies.map((company, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-center p-4 bg-gray-50 rounded-lg transition-all duration-300 ${
                    index === currentCompanySlide ? 'ring-2 ring-purple-600 bg-purple-50' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentCompanySlide(index)}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                      <img 
                        src={company.logo} 
                        alt={company.name} 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{company.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">İletişim</h2>
            <p className="text-xl text-gray-600">Size Herzaman En Uygun Hizmeti Hemen Şimdi Alın!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Telefon (7/24 Destek)</h3>
              <a href="tel:+905354979353" className="text-purple-600 hover:text-purple-700 block">0535 497 93 53</a>
              <a href="tel:+903246130300" className="text-purple-600 hover:text-purple-700 block">0324 613 03 00</a>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Adres</h3>
              <p className="text-gray-600">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=36.918030,34.896987"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Kızılmurat Mh. Ali Menteşoğlu Caddesi<br />
                  Bengi Apt altı No: z-1 Tarsus
                </a>
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Çalışma Saatleri</h3>
              <p className="text-gray-600">
                Pazartesi - Cumartesi<br />
                09:00 - 18:00
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}