'use client';

import { useState } from 'react';
import Link from 'next/link';
import LiveSupport from './LiveSupport';

const services = [
	{
		icon: '🚗',
		title: 'Trafik Sigortası',
		description:
			'Zorunlu trafik sigortası ile aracınızı ve kendinizi güvence altına alın. En uygun fiyatlarla hızlı işlem garantisi.',
		type: 'Trafik',
		link: '/trafik',
	},
	{
		icon: '🛡️',
		title: 'Kasko Sigortası',
		description:
			'Aracınızı her türlü riske karşı koruyun. Mini, genişletilmiş ve tam kasko seçenekleriyle yanınızdayız.',
		type: 'Kasko',
		link: '/kasko',
	},
	{
		icon: '🏠',
		title: 'Konut Sigortası',
		description:
			'Evinizi yangın, hırsızlık, deprem ve doğal afetlere karşı güvence altına alın. Ailenizin huzuru için.',
		type: 'Konut',
		link: '/konut',
	},
	{
		icon: '🏢',
		title: 'DASK',
		description:
			'Zorunlu deprem sigortası ile evinizi deprem riskine karşı sigortalayın. Hızlı ve güvenilir işlem.',
		type: 'DASK',
		link: '/dask',
	},
	{
		icon: '🔥',
		title: 'Yangın Sigortası',
		description:
			'İşyerinizi veya evinizi yangın risklerine karşı koruyun. Kapsamlı teminatlarla yanınızdayız.',
		type: 'Yangın',
		link: '/yangin',
	},
	{
		icon: '🚚',
		title: 'Nakliye Sigortası',
		description:
			'Taşınan mallarınızı her türlü riske karşı sigortalayın. Güvenli taşımacılık için doğru adres.',
		type: 'Nakliye',
		link: '/nakliye',
	},
];

export default function Services() {
	const [showSupport, setShowSupport] = useState(false);
	const [selectedType, setSelectedType] = useState('');

	const handleQuote = (type: string) => {
		setSelectedType(type);
		setShowSupport(true);
	};

	const handleCardClick = (service: any, e: React.MouseEvent) => {
		// Eğer teklif al butonuna tıklanmışsa, link navigasyonunu engelle
		if ((e.target as HTMLElement).closest('.quote-button')) {
			e.preventDefault();
			handleQuote(service.type);
		}
	};

	return (
		<>
			<section id="services" className="py-16 bg-gray-100">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-4xl font-bold text-gray-800 mb-4">
							Hizmetlerimiz
						</h2>
						<p className="text-xl text-gray-600">
							Size özel sigorta çözümleri sunuyoruz
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{services.map((service, index) => {
							// Eğer detay sayfası varsa Link ile sarala
							if (service.link && service.link !== '#') {
								return (
									<Link key={index} href={service.link}>
										<div
											className="bg-white rounded-2xl shadow-xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
											onClick={(e) => handleCardClick(service, e)}
										>
											<div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
												{service.icon}
											</div>
											<h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-purple-600 transition-colors">
												{service.title}
											</h3>
											<p className="text-gray-600 mb-6">
												{service.description}
											</p>

											<div className="flex items-center justify-between">
												<span className="text-purple-600 font-semibold group-hover:text-purple-700 transition flex items-center">
													Detayları Gör
													<svg
														className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M9 5l7 7-7 7"
														/>
													</svg>
												</span>

												<button
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														handleQuote(service.type);
													}}
													className="quote-button bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
												>
													Teklif Al
												</button>
											</div>
										</div>
									</Link>
								);
							} else {
								// Detay sayfası yoksa sadece teklif modal açılacak
								return (
									<div
										key={index}
										className="bg-white rounded-2xl shadow-xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
										onClick={() => handleQuote(service.type)}
									>
										<div className="text-5xl mb-6">{service.icon}</div>
										<h3 className="text-2xl font-bold text-gray-800 mb-4">
											{service.title}
										</h3>
										<p className="text-gray-600 mb-6">
											{service.description}
										</p>
										<button className="text-purple-600 font-semibold hover:text-purple-700 transition flex items-center w-full justify-center bg-purple-50 hover:bg-purple-100 py-3 rounded-lg">
											Teklif Al
											<svg
												className="w-4 h-4 ml-2"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</button>
									</div>
								);
							}
						})}
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