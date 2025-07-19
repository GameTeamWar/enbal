'use client';

import { useState } from 'react';

interface RejectQuoteModalProps {
  isOpen: boolean;
  quote: any;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectQuoteModal({
  isOpen,
  quote,
  onClose,
  onConfirm
}: RejectQuoteModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Önceden tanımlı iptal nedenleri
  const predefinedReasons = [
    'Eksik bilgi veya belge',
    'Teknik şartları karşılamıyor',
    'Fiyat uygun değil',
    'Müşteri talebi değişti',
    'Sigorta koşulları uygun değil',
    'Diğer (açıklama yazın)'
  ];

  const handleSubmit = async () => {
    const finalReason = rejectionReason === 'Diğer (açıklama yazın)' ? customReason : rejectionReason;
    
    if (!finalReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason.trim());
      // Reset form
      setRejectionReason('');
      setCustomReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRejectionReason('');
      setCustomReason('');
      onClose();
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Teklifi İptal Et</h3>
              <p className="text-sm text-gray-600">Bu işlem geri alınamaz</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quote Info */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            İptal Edilecek Teklif
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Müşteri:</span>
              <span className="text-red-800 font-semibold">{quote.name || 'Misafir'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Telefon:</span>
              <span className="text-red-800 font-semibold">{quote.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Sigorta Türü:</span>
              <span className="text-red-800 font-semibold">{quote.insuranceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Oluşturma Tarihi:</span>
              <span className="text-gray-800">{quote.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Rejection Reason Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              İptal Nedeni Seçin <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {predefinedReasons.map((reason) => (
                <label key={reason} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom reason textarea */}
          {rejectionReason === 'Diğer (açıklama yazın)' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İptal Nedeni Açıklaması <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                placeholder="İptal nedeninizi detaylı olarak açıklayın..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {customReason.length}/500 karakter
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium text-sm">Dikkat!</p>
              <p className="text-yellow-700 text-sm mt-1">
                Bu işlem sonrasında:
              </p>
              <ul className="text-yellow-700 text-sm mt-1 list-disc list-inside space-y-1">
                <li>Teklif iptal edilmiş olarak işaretlenir</li>
                <li>Müşteri otomatik olarak bilgilendirilir</li>
                <li>İptal nedeni kayıt altına alınır</li>
                <li>Bu işlem geri alınamaz</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Question */}
        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-gray-800 mb-2">
            Bu teklifi iptal etmek istediğinizden emin misiniz?
          </p>
          <p className="text-sm text-gray-600">
            Müşteri bilgilendirilecek ve teklif iptal edilecektir.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hayır, İptal
            </span>
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!rejectionReason || (rejectionReason === 'Diğer (açıklama yazın)' && !customReason.trim()) || isSubmitting}
            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  İptal Ediliyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Evet, İptal Et
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
