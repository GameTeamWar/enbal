'use client';

import { useState } from 'react';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import UserModal from './UserModal';

interface UsersComponentProps {
  users: any[];
  onUsersUpdate: () => void;
}

export default function UsersComponent({ users, onUsersUpdate }: UsersComponentProps) {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    tcno: '',
    email: '',
    role: 'user',
    password: ''
  });

  // Telefon numarası formatlaması
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = numbers;
    if (formatted.length > 0 && !formatted.startsWith('0')) {
      formatted = '0' + formatted;
    }
    formatted = formatted.slice(0, 11);
    
    if (formatted.length > 4) {
      formatted = formatted.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    } else if (formatted.length > 2) {
      formatted = formatted.replace(/(\d{4})(\d{1,3})/, '$1 $2');
    }
    
    return formatted;
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        toast.success('Kullanıcı silindi!');
        onUsersUpdate();
      } catch (error) {
        toast.error('Kullanıcı silinirken hata oluştu!');
        console.error(error);
      }
    }
  };

  const addUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      surname: '',
      phone: '',
      tcno: '',
      email: '',
      role: 'user',
      password: ''
    });
    setShowUserModal(true);
  };

  const editUser = (user: any) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name || '',
      surname: user.surname || '',
      phone: user.phone || '',
      tcno: user.tcno || '',
      email: user.email || '',
      role: user.role || 'user',
      password: '' // Şifre düzenleme için boş bırak
    });
    setShowUserModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Kullanıcı güncelleme
        const updateData: any = {
          name: userFormData.name,
          surname: userFormData.surname,
          phone: userFormData.phone,
          tcno: userFormData.tcno,
          email: userFormData.email,
          role: userFormData.role,
          updatedAt: new Date()
        };

        // Eğer şifre güncellenmişse
        if (userFormData.password) {
          updateData.tempPassword = userFormData.password; // Geçici şifre kaydet
          updateData.passwordUpdatedAt = new Date();
          updateData.passwordUpdatedBy = 'admin'; // Kimden güncellendi
        }

        await updateDoc(doc(db, 'users', editingUser.id), updateData);
        
        if (userFormData.password) {
          toast.success('Kullanıcı ve şifre başarıyla güncellendi! Yeni şifreyi kullanıcıya bildirin.');
        } else {
          toast.success('Kullanıcı başarıyla güncellendi!');
        }
      } else {
        // Yeni kullanıcı ekleme
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userFormData.email, 
          userFormData.password
        );

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userFormData.name,
          surname: userFormData.surname,
          phone: userFormData.phone,
          tcno: userFormData.tcno,
          email: userFormData.email,
          role: userFormData.role,
          createdAt: new Date(),
          createdBy: 'admin',
          isActive: true,
          tempPassword: userFormData.password // İlk şifre kaydet
        });

        toast.success('Kullanıcı başarıyla eklendi!');
      }

      setShowUserModal(false);
      onUsersUpdate();
    } catch (error: any) {
      console.error('Kullanıcı kaydetme hatası:', error);
      
      let errorMessage = 'Bir hata oluştu!';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu email adresi zaten kullanımda!';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf! En az 6 karakter olmalıdır.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi!';
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      {/* Kullanıcı Yönetimi Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h2>
        <button
          onClick={addUser}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Kullanıcı Ekle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">İsim Soyisim</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Telefon</th>
              <th className="text-left py-3 px-4">TC Kimlik</th>
              <th className="text-left py-3 px-4">Rol</th>
              <th className="text-left py-3 px-4">Son Şifre Güncellemesi</th>
              <th className="text-left py-3 px-4">Kayıt Tarihi</th>
              <th className="text-left py-3 px-4">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-semibold text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="font-medium">{user.name} {user.surname}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-600">{user.email || '-'}</span>
                </td>
                <td className="py-3 px-4">
                  <a href={`tel:${user.phone}`} className="text-purple-600 hover:text-purple-800">
                    {user.phone}
                  </a>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm">{user.tcno || '-'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? 'Danışman' : 'Kullanıcı'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {user.passwordUpdatedAt ? (
                    <div className="text-xs">
                      <div className="text-gray-800">
                        {user.passwordUpdatedAt?.toDate?.()?.toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-green-600 font-medium">
                        ✅ Güncellendi
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Güncellenmedi</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-500">
                    {user.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || '-'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editUser(user)}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      title="Kullanıcı ve şifre düzenle"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Düzenle
                    </button>

                    <button
                      onClick={() => {
                        window.open(`https://wa.me/90${user.phone.replace(/\D/g, '')}`, '_blank');
                      }}
                      className="text-green-600 hover:text-green-800 font-medium flex items-center"
                      title="WhatsApp ile iletişim"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.75"/>
                      </svg>
                      WhatsApp
                    </button>

                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 font-medium flex items-center"
                      title="Kullanıcıyı sil"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-gray-500 text-lg">Henüz kullanıcı bulunmamaktadır.</p>
            <button
              onClick={addUser}
              className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              İlk Kullanıcıyı Ekle
            </button>
          </div>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        editingUser={editingUser}
        userFormData={userFormData}
        onClose={() => setShowUserModal(false)}
        onSave={saveUser}
        onChange={setUserFormData}
        formatPhone={formatPhone}
      />
    </div>
  );
}