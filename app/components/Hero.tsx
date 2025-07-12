'use client';

import { useState } from 'react';
import LiveSupport from './LiveSupport';

export default function Hero() {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
                Güvenli Yarınlar İçin{' '}
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  Doğru Adres
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Enbal Sigorta olarak, sizin ve sevdiklerinizin güvenliği için en kapsamlı sigorta çözümlerini sunuyoruz.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => setShowSupport(true)}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-lg font-semibold hover:opacity-90 transition flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Hemen Teklif Al
                </button>
                <a 
                  href="tel:+905354979353" 
                  className="px-8 py-4 bg-gray-800 text-white rounded-lg text-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Bizi Arayın
                </a>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="animate-pulse">
                <img 
                  src="https://img.freepik.com/free-vector/insurance-services-concept-illustration_114360-7726.jpg" 
                  alt="Sigorta" 
                  className="w-full max-w-lg mx-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {showSupport && <LiveSupport onClose={() => setShowSupport(false)} />}
    </>
  );
}