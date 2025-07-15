// app/components/admin/SocialMediaManagement.tsx - Admin Panel Component
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  isActive: boolean;
  order: number;
  createdAt: any;
}

const AVAILABLE_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'twitter', label: 'Twitter (X)', icon: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
];

export function SocialMediaManagement() {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null);
  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    isActive: true,
    order: 1
  });

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const q = query(collection(db, 'socialMedia'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const links: SocialMediaLink[] = [];
      
      querySnapshot.forEach((doc) => {
        links.push({ id: doc.id, ...doc.data() } as SocialMediaLink);
      });
      
      setSocialLinks(links);
    } catch (error) {
      console.error('Sosyal medya linkleri alınamadı:', error);
      toast.error('Sosyal medya linkleri yüklenemedi!');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingLink(null);
    setFormData({
      platform: '',
      url: '',
      isActive: true,
      order: socialLinks.length + 1
    });
    setShowModal(true);
  };

  const handleEdit = (link: SocialMediaLink) => {
    setEditingLink(link);
    setFormData({
      platform: link.platform,
      url: link.url,
      isActive: link.isActive,
      order: link.order
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.url) {
      toast.error('Platform ve URL alanları zorunludur!');
      return;
    }

    // URL formatını kontrol et
    if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
      toast.error('URL https:// veya http:// ile başlamalıdır!');
      return;
    }

    setLoading(true);

    try {
      const linkData = {
        platform: formData.platform,
        url: formData.url,
        icon: formData.platform, // Platform adını icon olarak kullan
        isActive: formData.isActive,
        order: formData.order,
        updatedAt: serverTimestamp()
      };

      if (editingLink) {
        // Güncelle
        await updateDoc(doc(db, 'socialMedia', editingLink.id), linkData);
        toast.success('Sosyal medya linki güncellendi!');
      } else {
        // Yeni ekle
        await addDoc(collection(db, 'socialMedia'), {
          ...linkData,
          createdAt: serverTimestamp()
        });
        toast.success('Sosyal medya linki eklendi!');
      }

      setShowModal(false);
      fetchSocialLinks();
    } catch (error) {
      console.error('Sosyal medya linki kaydedilemedi:', error);
      toast.error('İşlem başarısız!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (linkId: string, platform: string) => {
    if (confirm(`${platform} linkini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteDoc(doc(db, 'socialMedia', linkId));
        toast.success('Sosyal medya linki silindi!');
        fetchSocialLinks();
      } catch (error) {
        console.error('Silme hatası:', error);
        toast.error('Silme işlemi başarısız!');
      }
    }
  };

  const toggleActive = async (link: SocialMediaLink) => {
    try {
      await updateDoc(doc(db, 'socialMedia', link.id), {
        isActive: !link.isActive,
        updatedAt: serverTimestamp()
      });
      toast.success(`${link.platform} ${!link.isActive ? 'aktif edildi' : 'pasif edildi'}!`);
      fetchSocialLinks();
    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
      toast.error('İşlem başarısız!');
    }
  };

  const getPlatformInfo = (platform: string) => {
    return AVAILABLE_PLATFORMS.find(p => p.value === platform) || { icon: '🔗', label: platform };
  };

  if (loading && socialLinks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Sosyal Medya Yönetimi</h2>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Link Ekle
        </button>
      </div>

      {socialLinks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Henüz sosyal medya linki eklenmemiş</h3>
          <p className="text-gray-600 mb-4">İlk sosyal medya linkinizi ekleyerek başlayın</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            İlk Linki Ekle
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {socialLinks.map((link) => {
            const platformInfo = getPlatformInfo(link.platform);
            return (
              <div key={link.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{platformInfo.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{platformInfo.label}</h3>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 truncate max-w-xs block"
                    >
                      {link.url}
                    </a>
                    <p className="text-xs text-gray-500">Sıra: {link.order}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(link)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      link.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {link.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(link)}
                    className="p-2 text-blue-600 hover:text-blue-700"
                    title="Düzenle"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleDelete(link.id, link.platform)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Sil"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editingLink ? 'Sosyal Medya Linkini Düzenle' : 'Yeni Sosyal Medya Linki'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({...formData, platform: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Platform seçin</option>
                  {AVAILABLE_PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://www.facebook.com/enbalsigorta"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Aktif olarak göster
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : (editingLink ? 'Güncelle' : 'Ekle')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}