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
  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
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

        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fiyat (TL)
            </label>
            <input
              type="number"
              value={responseData.price}
              onChange={(e) => onChange({...responseData, price: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

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

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onSend}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
            >
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