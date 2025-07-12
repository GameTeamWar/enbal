'use client';

import { useState } from 'react';
import LiveSupport from './LiveSupport';

const services = [
  {
    icon: '🚗',
    title: 'Trafik Sigortası',
    description: 'Zorunlu trafik sigortası ile aracınızı ve kendinizi güvence altına alın. En uygun fiyatlarla hızlı işlem garantisi.',
    type: 'Trafik'
  },
  {
    icon: '🛡️',
    title: 'Kasko Sigortası',
    description: 'Aracınızı her türlü riske karşı koruyun. Mini, genişletilmiş ve tam kasko seçenekleriyle yanınızdayız.',
    type: 'Kasko'
  },
  {
    icon: '🏠',
    title: 'Konut Sigortası',
    description: 'Evinizi yangın, hırsızlık, deprem ve doğal afetlere karşı güvence altına alın. Ailenizin huzuru için.',
    type: 'Konut'
  },
  {
    icon: '🏢',
    title: 'DASK',
    description: 'Zorunlu deprem sigortası ile evinizi deprem riskine karşı sigortalayın. Hızlı ve güvenilir işlem.',
    type: 'DASK'
  },
  {
    icon: '🔥',
    title: 'Yangın Sigortası',
    description: 'İşyerinizi veya evinizi yangın risklerine karşı koruyun. Kapsamlı teminatlarla yanınızdayız.',
    type: 'Yangın'
  },
  {
    icon: '🚚',
    title: 'Nakliye Sigortası',
    description: 'Taşınan mallarınızı her türlü riske karşı sigortalayın. Güvenli taşımacılık için doğru adres.',
    type: 'Nakliye'
  }
];

export default function Services() {
  const [showSupport, setShowSupport] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  const handleQuote = (type: string) => {
    setSelectedType(type);
    setShowSupport(true);
  };

  return (
    <>
      <section id="services" className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Hizmetlerimiz</h2>
            <p className="text-xl text-gray-600">Size özel sigorta çözümleri sunuyoruz</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-5xl mb-6">{service.icon}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <button 
                  onClick={() => handleQuote(service.type)}
                  className="text-purple-600 font-semibold hover:text-purple-700 transition flex items-center"
                >
                  Teklif Al 
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {showSupport && (
        <LiveSupport 
          onClose={() => setShowSupport(false)} 
          initialType={selectedType}
        />
      )}
    </>
  );
}