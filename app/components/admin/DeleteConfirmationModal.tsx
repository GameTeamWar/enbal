'use client';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  quote: any;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  quote,
  onClose,
  onConfirm
}: DeleteConfirmationModalProps) {
  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-red-600 mb-2">TEHLİKELİ İŞLEM!</h3>
          <p className="text-lg font-semibold text-gray-800">Teklifi Kalıcı Olarak Sil</p>
        </div>

        {/* Müşteri Bilgileri */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-red-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Silinecek Teklif Bilgileri
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Müşteri:</span>
              <span className="font-semibold text-red-800">{quote.name || 'Misafir'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Telefon:</span>
              <span className="font-semibold text-red-800">{quote.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Sigorta Türü:</span>
              <span className="font-semibold text-red-800">{quote.insuranceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Teklif ID:</span>
              <span className="font-mono text-xs bg-red-100 px-2 py-1 rounded">{quote.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Oluşturma Tarihi:</span>
              <span className="text-gray-800">{quote.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || 'N/A'}</span>
            </div>
            {quote.price && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Fiyat:</span>
                <span className="font-semibold text-green-600">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(quote.price))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Uyarı Mesajı */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-yellow-800 font-bold text-sm mb-2">Bu İşlemi Yaparsanız:</p>
              <ul className="text-yellow-700 text-sm space-y-1 list-none">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">❌</span>
                  <span>Müşterinin oluşturmuş olduğu teklif <strong>tamamen silinecek</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">❌</span>
                  <span>Müşteri bu teklife <strong>bir daha ulaşamayacak</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">❌</span>
                  <span>Tüm teklif geçmişi ve belgeleri <strong>kaybolacak</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">❌</span>
                  <span>Bu işlem <strong>geri alınamaz</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">❌</span>
                  <span>Müşteri ile yapılan tüm iletişim kayıtları silinir</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Öneriler */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-blue-800 font-medium text-sm mb-2">💡 Alternatif Öneriler:</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Teklifi silmek yerine "İptal Et" işlemini kullanabilirsiniz</li>
                <li>• İptal edilen teklifler arşivlenir ve geri getirilebilir</li>
                <li>• Müşteri yeni teklif oluşturabilir</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Onay Sorusu */}
        <div className="text-center mb-6">
          <p className="text-lg font-bold text-gray-800 mb-2">
            Gerçekten bu teklifi kalıcı olarak silmek istediğinizden emin misiniz?
          </p>
          <p className="text-sm text-gray-600">
            Bu işlem geri alınamaz ve müşteri teklife bir daha erişemeyecektir.
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition font-medium flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            HAYIR, İptal Et
          </button>
          
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            EVET, Kalıcı Olarak SİL
          </button>
        </div>

        {/* Son uyarı */}
        <div className="mt-4 text-center">
          <p className="text-xs text-red-600 font-medium">
            ⚠️ Son Uyarı: Bu işlem sonrasında müşteri ile iletişime geçip yeni teklif oluşturmasını söylemeniz gerekebilir.
          </p>
        </div>
      </div>
    </div>
  );
}
