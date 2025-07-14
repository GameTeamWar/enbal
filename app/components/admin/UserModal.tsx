'use client';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
              <input
                type="text"
                required
                value={userFormData.name}
                onChange={(e) => onChange({...userFormData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyisim</label>
              <input
                type="text"
                required
                value={userFormData.surname}
                onChange={(e) => onChange({...userFormData, surname: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={userFormData.email}
              onChange={(e) => onChange({...userFormData, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              required
              value={userFormData.phone}
              onChange={(e) => onChange({...userFormData, phone: formatPhone(e.target.value)})}
              placeholder="0XXX XXX XX XX"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
            <input
              type="text"
              value={userFormData.tcno}
              onChange={(e) => onChange({...userFormData, tcno: e.target.value.replace(/\D/g, '').slice(0, 11)})}
              placeholder="11 haneli TC kimlik numarası"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={userFormData.role}
              onChange={(e) => onChange({...userFormData, role: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="user">Kullanıcı</option>
              <option value="admin">Danışman</option>
            </select>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input
                type="password"
                required
                value={userFormData.password}
                onChange={(e) => onChange({...userFormData, password: e.target.value})}
                placeholder="En az 6 karakter"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition"
            >
              {editingUser ? 'Güncelle' : 'Ekle'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}