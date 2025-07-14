'use client';

interface QuoteDetailModalProps {
  isOpen: boolean;
  quote: any;
  users: any[]; // Danışman bilgileri için
  onClose: () => void;
  onQuoteResponse: (quote: any) => void;
  onDocumentUpload: (quote: any) => void;
  onRejectQuote: (quote: any) => void;
  getStatusBadge: (quote: any) => JSX.Element;
  copyToClipboard: (text: string, label: string) => void;
}

export default function QuoteDetailModal({
  isOpen,
  quote,
  users,
  onClose,
  onQuoteResponse,
  onDocumentUpload,
  onRejectQuote,
  getStatusBadge,
  copyToClipboard
}: QuoteDetailModalProps) {
  if (!isOpen || !quote) return null;

  // Danışman bilgilerini bul
  const getConsultantInfo = (userId: string) => {
    const consultant = users.find(user => user.id === userId);
    if (consultant) {
      return `${consultant.name} ${consultant.surname}`;
    }
    return 'Bilinmiyor';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Teklif Detayları
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol Kolon - Temel Bilgiler */}
          <div className="space-y-6">
            {/* Teklif Bilgileri */}
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                📋 Teklif Bilgileri
              </h4>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Teklif ID:</span>
                  <code className="bg-blue-200 px-2 py-1 rounded text-sm">{quote.id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Sigorta Türü:</span>
                  <span className="font-semibold">{quote.insuranceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Durum:</span>
                  {getStatusBadge(quote)}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Oluşturma Tarihi:</span>
                  <span>{quote.createdAt?.toDate?.()?.toLocaleString('tr-TR') || 'N/A'}</span>
                </div>
                {quote.responseDate && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Cevap Tarihi:</span>
                    <span>{quote.responseDate?.toDate?.()?.toLocaleString('tr-TR')}</span>
                  </div>
                )}
                {quote.price && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Fiyat:</span>
                    <span className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(quote.price))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Müşteri Bilgileri */}
            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                👤 Müşteri Bilgileri
              </h4>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">İsim Soyisim:</span>
                  <span className="font-semibold">{quote.name || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Telefon:</span>
                  <a href={`tel:${quote.phone}`} className="text-green-600 hover:text-green-800 font-semibold">
                    {quote.phone}
                  </a>
                </div>
                {quote.tcno && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">TC Kimlik:</span>
                    <span className="font-mono">{quote.tcno}</span>
                  </div>
                )}
                {quote.birthdate && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Doğum Tarihi:</span>
                    <span>{new Date(quote.birthdate).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
                {quote.address && (
                  <div>
                    <span className="font-medium text-gray-600 block mb-1">Adres:</span>
                    <p className="text-sm bg-white p-2 rounded border">{quote.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Araç/Mülk Bilgileri */}
            {(quote.plate || quote.registration || quote.propertyType || quote.propertyAddress) && (
              <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
                <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {quote.plate || quote.registration ? '🚗 Araç Bilgileri' : '🏠 Mülk Bilgileri'}
                </h4>
                <div className="space-y-3 text-gray-700">
                  {quote.plate && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Plaka:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">{quote.plate}</span>
                    </div>
                  )}
                  {quote.registration && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Ruhsat Seri:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">{quote.registration}</span>
                    </div>
                  )}
                  {quote.propertyType && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Mülk Türü:</span>
                      <span className="font-semibold">{quote.propertyType}</span>
                    </div>
                  )}
                  {quote.propertyAddress && (
                    <div>
                      <span className="font-medium text-gray-600 block mb-1">Mülk Adresi:</span>
                      <p className="text-sm bg-white p-2 rounded border">{quote.propertyAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* YENİ: Danışman Bilgileri */}
            <div className="bg-indigo-50 rounded-lg p-6 border-l-4 border-indigo-500">
              <h4 className="font-semibold text-indigo-800 mb-4 flex items-center"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
               👨‍💼 Danışman Bilgileri
             </h4>
             <div className="space-y-3 text-gray-700">
               <div className="flex justify-between">
                 <span className="font-medium text-gray-600">Cevap Veren Danışman:</span>
                 <span className="font-semibold text-indigo-800">
                   {quote.respondedBy ? getConsultantInfo(quote.respondedBy) : 'Henüz cevaplanmadı'}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="font-medium text-gray-600">Belge Yükleyen Danışman:</span>
                 <span className="font-semibold text-indigo-800">
                   {quote.documentUploadedBy ? getConsultantInfo(quote.documentUploadedBy) : 'Henüz yüklenmedi'}
                 </span>
               </div>
               {quote.documentUploadDate && (
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Belge Yükleme Tarihi:</span>
                   <span>{quote.documentUploadDate?.toDate?.()?.toLocaleString('tr-TR')}</span>
                 </div>
               )}
             </div>
           </div>
         </div>

         {/* Sağ Kolon - Admin Notları ve İşlemler */}
         <div className="space-y-6">
           {/* Admin Cevabı */}
           {quote.adminResponse && (
             <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
               <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
                 📝 Müşteriye Gönderilen Cevap
               </h4>
               <div className="bg-white p-4 rounded border border-blue-200">
                 <p className="text-gray-800 whitespace-pre-wrap">{quote.adminResponse}</p>
               </div>
               {quote.respondedBy && (
                 <div className="mt-2 text-xs text-blue-600">
                   Danışman: {getConsultantInfo(quote.respondedBy)}
                 </div>
               )}
             </div>
           )}

           {/* Admin Notları */}
           {quote.adminNotes && (
             <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
               <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
                 🗒️ Danışman Notları (İç Kullanım)
               </h4>
               <div className="bg-white p-4 rounded border border-yellow-200">
                 <p className="text-gray-800 whitespace-pre-wrap">{quote.adminNotes}</p>
               </div>
             </div>
           )}

           {/* Red Nedeni */}
           {quote.rejectionReason && (
             <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
               <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 ❌ Red Nedeni
               </h4>
               <div className="bg-white p-4 rounded border border-red-200">
                 <p className="text-gray-800 whitespace-pre-wrap">{quote.rejectionReason}</p>
               </div>
               {quote.rejectedBy && (
                 <div className="mt-2 text-xs text-red-600">
                   Reddeden Danışman: {getConsultantInfo(quote.rejectedBy)}
                 </div>
               )}
             </div>
           )}

           {/* Müşteri Red Nedeni */}
           {quote.customerRejectionReason && (
             <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-500">
               <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
                 👤 Müşteri Red Nedeni
               </h4>
               <div className="bg-white p-4 rounded border border-gray-200">
                 <p className="text-gray-800 whitespace-pre-wrap">{quote.customerRejectionReason}</p>
               </div>
             </div>
           )}

           {/* Ödeme Bilgileri */}
           {quote.paymentInfo && (
             <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-500">
               <h4 className="font-bold text-green-800 mb-4 flex items-center text-lg">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
                 💳 KART BİLGİLERİ (AÇIK GÖRÜNÜM)
               </h4>
               
               <div className="space-y-4">
                 {/* Kart Sahibi */}
                 <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                   <div className="flex justify-between items-center">
                     <div className="flex-1">
                       <span className="font-bold text-gray-700 text-sm block mb-1">👤 KART SAHİBİ:</span>
                       <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block">
                         {quote.paymentInfo.cardHolder}
                       </span>
                     </div>
                     <button
                       onClick={() => copyToClipboard(quote.paymentInfo.cardHolder, 'Kart sahibi')}
                       className="ml-3 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md"
                       title="Kart sahibini kopyala"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                     </button>
                   </div>
                 </div>

                 {/* Kart Numarası */}
                 <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                   <div className="flex justify-between items-center">
                     <div className="flex-1">
                       <span className="font-bold text-gray-700 text-sm block mb-1">💳 KART NUMARASI:</span>
                       <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block font-mono">
                         {(quote.paymentInfo.originalCardNumber || quote.paymentInfo.cardNumber).replace(/(\d{4})(?=\d)/g, '$1 ')}
                       </span>
                     </div>
                     <button
                       onClick={() => copyToClipboard(
                         (quote.paymentInfo.originalCardNumber || quote.paymentInfo.cardNumber).replace(/\s/g, ''), 
                         'Kart numarası'
                       )}
                       className="ml-3 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
                       title="Kart numarasını kopyala"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                     </button>
                   </div>
                 </div>

                 {/* Son Kullanma ve CVV - Yan Yana */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                     <div className="flex justify-between items-center">
                       <div className="flex-1">
                         <span className="font-bold text-gray-700 text-sm block mb-1">📅 SON KULLANMA:</span>
                         <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block font-mono">
                           {quote.paymentInfo.expiryDate}
                         </span>
                       </div>
                       <button
                         onClick={() => copyToClipboard(quote.paymentInfo.expiryDate, 'Son kullanma tarihi')}
                         className="ml-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-md"
                         title="Son kullanma tarihini kopyala"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                       </button>
                     </div>
                   </div>
                   
                   <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                     <div className="flex justify-between items-center">
                       <div className="flex-1">
                         <span className="font-bold text-gray-700 text-sm block mb-1">🔒 CVV KODU:</span>
                         <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border block font-mono">
                           {quote.paymentInfo.originalCvv || quote.paymentInfo.cvv}
                         </span>
                       </div>
                       <button
                         onClick={() => copyToClipboard(
                           quote.paymentInfo.originalCvv || quote.paymentInfo.cvv, 
                           'CVV kodu'
                         )}
                         className="ml-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
                         title="CVV kodunu kopyala"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* Taksit ve Gönderim Bilgisi */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                     <span className="font-bold text-gray-700 text-sm block mb-1">💰 TAKSİT:</span>
                     <div className="flex items-center justify-between">
                       <span className="font-bold text-gray-900 text-lg bg-gray-100 px-3 py-2 rounded border">
                         {quote.paymentInfo.installments === '1' ? 'TEK ÇEKİM' : quote.paymentInfo.installments + ' TAKSİT'}
                       </span>
                       <button
                         onClick={() => copyToClipboard(
                           quote.paymentInfo.installments === '1' ? 'Tek Çekim' : quote.paymentInfo.installments + ' Taksit', 
                           'Taksit bilgisi'
                         )}
                         className="ml-2 p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-md"
                         title="Taksit bilgisini kopyala"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                       </button>
                     </div>
                   </div>
                   
                   <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                     <span className="font-bold text-gray-700 text-sm block mb-1">📅 GÖNDERİM TARİHİ:</span>
                     <span className="text-gray-900 text-sm bg-gray-100 px-3 py-2 rounded border block">
                       {quote.customerResponseDate?.toDate?.()?.toLocaleString('tr-TR') || 'Bilinmiyor'}
                     </span>
                   </div>
                 </div>

                 {/* Hızlı Kopyalama Butonu */}
                 <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                   <button
                     onClick={() => {
                       const allCardInfo = `
KART SAHİBİ: ${quote.paymentInfo.cardHolder}
KART NO: ${(quote.paymentInfo.originalCardNumber || quote.paymentInfo.cardNumber).replace(/\s/g, '')}
SON KULLANMA: ${quote.paymentInfo.expiryDate}
CVV: ${quote.paymentInfo.originalCvv || quote.paymentInfo.cvv}
TAKSİT: ${quote.paymentInfo.installments === '1' ? 'Tek Çekim' : quote.paymentInfo.installments + ' Taksit'}
TUTAR: ${quote.price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(quote.price)) : 'Belirtilmemiş'}
                       `.trim();
                       copyToClipboard(allCardInfo, 'Tüm kart bilgileri');
                     }}
                     className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition shadow-lg font-bold"
                   >
                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                     </svg>
                     📋 TÜM KART BİLGİLERİNİ KOPYALA
                   </button>
                 </div>
               </div>

               {/* Güvenlik Uyarısı */}
               <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                 <div className="flex items-start space-x-2">
                   <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                   </svg>
                   <div>
                     <p className="text-yellow-800 font-medium text-xs">🔒 GÜVENLİK UYARISI</p>
                     <p className="text-yellow-700 text-xs mt-1">
                       Bu bilgiler hassastır! İşlem tamamlandıktan sonra güvenli şekilde saklayın ve yetkisiz kişilerle paylaşmayın.
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Sistem Bilgileri */}
           <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-400">
             <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               ⚙️ Sistem Bilgileri
             </h4>
             <div className="space-y-2 text-sm text-gray-600">
               <div className="flex justify-between ">
                 <span className="font-medium text-gray-600">Kullanıcı ID:</span>
                 <code className="bg-white px-2 py-1 rounded text-xs">{quote.userId || 'Misafir'}</code>
               </div>
               <div className="flex justify-between">
                 <span className="font-medium text-gray-600">Kendi Bilgileri:</span>
                 <span className={quote.isForSelf ? 'text-green-600' : 'text-gray-600'}>
                   {quote.isForSelf ? 'Evet' : 'Hayır'}
                 </span>
               </div>
               {quote.awaitingProcessing !== undefined && (
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">İşlem Bekliyor:</span>
                   <span className={quote.awaitingProcessing ? 'text-orange-600' : 'text-green-600'}>
                     {quote.awaitingProcessing ? 'Evet' : 'Hayır'}
                   </span>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>

       {/* Modal Alt Kısım - Hızlı İşlemler */}
       <div className="mt-8 pt-6 border-t">
         <h4 className="font-semibold text-gray-700 mb-4">🚀 Hızlı İşlemler</h4>
         <div className="flex flex-wrap gap-3">
           {quote.status === 'pending' && (
             <>
               <button
                 onClick={() => {
                   onClose();
                   onQuoteResponse(quote);
                 }}
                 className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
               >
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
                 Cevapla
               </button>
               <button
                 onClick={() => {
                   onClose();
                   onRejectQuote(quote);
                 }}
                 className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
               >
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
                 Reddet
               </button>
             </>
           )}

           {quote.customerStatus === 'card_submitted' && !quote.documentUrl && (
             <button
               onClick={() => {
                 onClose();
                 onDocumentUpload(quote);
               }}
               className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
             >
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
               </svg>
               Belge Yükle
             </button>
           )}

           <button
             onClick={() => {
               window.open(`https://wa.me/90${quote.phone.replace(/\D/g, '')}`, '_blank');
             }}
             className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
           >
             <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.75"/>
             </svg>
             WhatsApp
           </button>

           <button
             onClick={onClose}
             className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
           >
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
             Kapat
           </button>
         </div>
       </div>
     </div>
   </div>
 );
}