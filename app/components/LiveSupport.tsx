'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface LiveSupportProps {
  onClose: () => void;
  initialType?: string;
}

export default function LiveSupport({ onClose, initialType = '' }: LiveSupportProps) {
  const [formData, setFormData] = useState({
    insuranceType: initialType,
    phone: '',
    tcno: '',
    birthdate: '',
    plate: '',
    registration: '',
    propertyType: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // WhatsApp API çağrısı burada yapılacak
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Teklif talebiniz alındı! En kısa sürede WhatsApp üzerinden size dönüş yapılacaktır.');
        onClose();
      } else {
        toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const showVehicleFields = formData.insuranceType === 'Trafik' || formData.insuranceType === 'Kasko';
  const showPropertyFields = !showVehicleFields && formData.insuranceType !== '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Canlı Destek - Teklif Al</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Sigorta Türü</label>
            <select 
              value={formData.insuranceType}
              onChange={(e) => setFormData({...formData, insuranceType: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
              required
            >
              <option value="">Seçiniz</option>
              <option value="Trafik">Trafik Sigortası</option>
              <option value="Kasko">Kasko Sigortası</option>
              <option value="Konut">Konut Sigortası</option>
              <option value="DASK">DASK</option>
              <option value="Yangın">Yangın Sigortası</option>
              <option value="Nakliye">Nakliye Sigortası</option>
            </select>
          </div>
          
          {formData.insuranceType && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Telefon Numarası</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                  placeholder="05XX XXX XX XX" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Kimlik Numarası</label>
                <input 
                  type="text" 
                  value={formData.tcno}
                  onChange={(e) => setFormData({...formData, tcno: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                  placeholder="XXXXXXXXXXX" 
                  maxLength={11} 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Doğum Tarihi</label>
                <input 
                  type="date" 
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                  required 
                />
              </div>
              
              {showVehicleFields && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Araç Plakası</label>
                    <input 
                      type="text" 
                      value={formData.plate}
                      onChange={(e) => setFormData({...formData, plate: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      placeholder="34ABC123" 
                      required 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Ruhsat Seri No</label>
                    <input 
                      type="text" 
                      value={formData.registration}
                      onChange={(e) => setFormData({...formData, registration: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      placeholder="AA000000" 
                      required 
                    />
                  </div>
                </>
              )}
              
              {showPropertyFields && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Mülk Türü</label>
                    <select 
                      value={formData.propertyType}
                      onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      required
                    >
                      <option value="">Seçiniz</option>
                      <option value="Ev">Ev</option>
                      <option value="İşyeri">İşyeri</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Adres</label>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500" 
                      rows={3} 
                      placeholder="Tam adresinizi giriniz" 
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Teklif İste
          </button>
        </form>
      </div>
    </div>
  );
}