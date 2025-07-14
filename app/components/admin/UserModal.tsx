// app/components/admin/UserModal.tsx - Email Kaldırılmış Versiyon
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface UserModalProps {
  isOpen: boolean;
  editingUser: any;
  userFormData: any;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChange: (data: any) => void;
  formatPhone: (value: string) => string;
}

export default function UserModal({
  isOpen,
  editingUser,
  userFormData,
  onClose,
  onSave,
  onChange,
  formatPhone
}: UserModalProps) {
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // En az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter garantisi
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    // Geri kalan karakterleri rastgele doldur
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Karıştır
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    onChange({ ...userFormData, password: newPassword });
    toast.success('Yeni şifre oluşturuldu!');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Şifre kopyalandı!');
    } catch (err) {
      toast.error('Kopyalama başarısız!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
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

        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İsim *</label>
              <input
                type="text"
                required
                value={userFormData.name}
                onChange={(e) => onChange({...userFormData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="İsim"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyisim *</label>
              <input
                type="text"
                required
                value={userFormData.surname}
                onChange={(e) => onChange({...userFormData, surname: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Soyisim"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası *</label>
            <input
              type="tel"
              required
              value={userFormData.phone}
              onChange={(e) => onChange({...userFormData, phone: formatPhone(e.target.value)})}
              placeholder="05XX XXX XX XX"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={13}
            />
            <p className="text-xs text-gray-500 mt-1">
              Bu telefon numarası giriş yaparken kullanılacak
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
            <input
              type="text"
              value={userFormData.tcno}
              onChange={(e) => onChange({...userFormData, tcno: e.target.value.replace(/\D/g, '').slice(0, 11)})}
              placeholder="11 haneli TC kimlik numarası"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <select
              value={userFormData.role}
              onChange={(e) => onChange({...userFormData, role: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="user">Kullanıcı</option>
              <option value="admin">Danışman</option>
            </select>
          </div>

          {/* Şifre Yönetimi Bölümü */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Şifre Yönetimi</label>
              {editingUser && (
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  {showPasswordSection ? 'Gizle' : 'Şifre Değiştir'}
                </button>
              )}
            </div>

            {(!editingUser || showPasswordSection) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'Yeni Şifre' : 'Şifre *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required={!editingUser}
                      value={userFormData.password}
                      onChange={(e) => onChange({...userFormData, password: e.target.value})}
                      placeholder={editingUser ? "Yeni şifre girin veya otomatik oluşturun" : "Şifre girin veya otomatik oluşturun"}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    />
                    {userFormData.password && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(userFormData.password)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Şifreyi kopyala"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 karakter olmalıdır
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Otomatik Oluştur
                  </button>
                  
                  {userFormData.password && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(userFormData.password)}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopyala
                    </button>
                  )}
                </div>

                {userFormData.password && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-yellow-800 font-medium text-xs">Önemli Bilgilendirme</p>
                        <p className="text-yellow-700 text-xs mt-1">
                          Bu şifreyi kopyalayıp güvenli bir yerde saklayın. Kullanıcıya telefon ile bildirin.
                          {editingUser && (
                            <><br/>Telefon numarası değişirse kullanıcı yeni numarası ile giriş yapmalıdır.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bilgilendirme Notları */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-blue-800 font-medium text-sm">Giriş Bilgileri</p>
                <div className="text-blue-700 text-sm mt-1">
                  <p>• <strong>Kullanıcı Adı:</strong> Telefon numarası (05XXXXXXXXX)</p>
                  <p>• <strong>Şifre:</strong> Belirlenen şifre</p>
                  <p>• Bu bilgileri kullanıcıya güvenli bir şekilde bildirin</p>
                  {editingUser && (
                    <p className="mt-2 text-orange-700 font-medium">
                      ⚠️ Değişiklikler kayıt edildiğinde kullanıcının giriş bilgileri güncellenecektir.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              {editingUser ? 'Güncelle' : 'Kullanıcı Ekle'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}