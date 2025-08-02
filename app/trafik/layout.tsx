import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trafik Sigortası | En Uygun Fiyatlar - Enbal Sigorta Tarsus Mersin',
  description: 'Zorunlu trafik sigortası ile üçüncü şahıslara karşı sorumluluklarınızı güvence altına alın. En uygun fiyatlarla trafik sigortası için 0535 497 93 53',
  keywords: ['trafik sigortası', 'zorunlu trafik sigortası', 'araç sigortası', 'adana trafik sigortası', 'tarsus trafik sigortası'],
};

export default function TrafikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
