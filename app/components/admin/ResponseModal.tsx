// app/components/admin/ResponseModal.tsx - Taksit Seçimi Eklendi
'use client';

interface ResponseModalProps {
  isOpen: boolean;
  quote: any;
  responseData: any;
  onClose: () => void;
  onSend: () => void;
  onChange: (data: any) => void;
}

export default function ResponseModal({
  isOpen,
  quote,
  responseData,
  onClose,
  onSend,
  onChange
}: ResponseModalProps) {
  const calculateInstallmentAmount = (totalAmount: string, installments: number) => {
    if (!totalAmount || installments <= 0) return 0;
    const amount = parseFloat(totalAmount);
    return amount / installments;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Teklif Cevabı Gönder</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteriye Gönderilecek Açıklama *
            </label>
            <textarea
              value={responseData.adminResponse}
              onChange={(e) => onChange({...responseData, adminResponse: e.target.value})}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Teklif açıklamasını buraya yazın..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyat (TL) *
              </label>
              <input
                type="number"
                step="0.01"
                value={responseData.price}
                onChange={(e) => onChange({...responseData, price: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksimum Taksit Sayısı
              </label>
              <select
                value={responseData.maxInstallments || 1}
                onChange={(e) => onChange({...responseData, maxInstallments: parseInt(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>Tek Çekim</option>
                <option value={2}>2 Taksit</option>
                <option value={3}>3 Taksit</option>
                <option value={6}>6 Taksit</option>
                <option value={9}>9 Taksit</option>
                <option value={12}>12 Taksit</option>
                <option value={18}>18 Taksit</option>
                <option value={24}>24 Taksit</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Kullanıcı bu sayıya kadar taksit seçebilir
              </p>
            </div>
          </div>

          {/* Taksit Önizlemesi */}
          {responseData.price && responseData.maxInstallments && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 0l-3-3m3 3l-3 3m-2 6l3-3m-3 3l3 3M13 3l3 3m-3-3l3 3" />
                </svg>
                Taksit Seçenekleri Önizlemesi
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: Math.min(6, responseData.maxInstallments) }, (_, i) => {
                  const installmentCount = i + 1;
                  if (installmentCount > responseData.maxInstallments) return null;
                  
                  const installmentAmount = calculateInstallmentAmount(responseData.price, installmentCount);
                  
                  return (
                    <div key={installmentCount} className="bg-white p-3 rounded border text-center">
                      <div className="font-medium text-gray-800">
                        {installmentCount === 1 ? 'Tek Çekim' : `${installmentCount} Taksit`}
                      </div>
                      <div className="text-sm text-blue-600 font-semibold">
                        {installmentCount === 1 
                          ? formatPrice(parseFloat(responseData.price))
                          : `${formatPrice(installmentAmount)} × ${installmentCount}`
                        }
                      </div>
                      {installmentCount > 1 && (
                        <div className="text-xs text-gray-500">
                          Toplam: {formatPrice(parseFloat(responseData.price))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {responseData.maxInstallments > 6 && (
                <div className="mt-2 text-xs text-blue-600">
                  + {responseData.maxInstallments - 6} taksit seçeneği daha...
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notları (İç kullanım)
            </label>
            <textarea
              value={responseData.adminNotes}
              onChange={(e) => onChange({...responseData, adminNotes: e.target.value})}
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="İç notlarınızı buraya yazabilirsiniz..."
            />
          </div>

          {/* Bilgilendirme */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-yellow-800 font-medium text-sm">Önemli Bilgi</p>
                <p className="text-yellow-700 text-sm mt-1">
                  • Kullanıcı, belirlediğiniz maksimum taksit sayısına kadar seçim yapabilir<br/>
                  • Tek çekim her zaman seçenek olarak sunulur<br/>
                  • Taksit tutarları otomatik hesaplanır
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onSend}
              disabled={!responseData.adminResponse.trim() || !responseData.price || parseFloat(responseData.price) <= 0}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Cevabı Gönder
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}