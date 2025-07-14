'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: '',
    surname: '',
    photoURL: '',
    uid: '',
    role: ''
  });

  type Notification = {
    id: string;
    read?: boolean;
    type?: string;
    insuranceType?: string;
    message?: string;
    title?: string;
    createdAt?: any;
    triggered?: boolean;
    [key: string]: any;
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Ana sayfa kontrolü
  const isHomePage = pathname === '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setIsLoggedIn(true);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              name: userData.name || '',
              surname: userData.surname || '',
              photoURL: userData.photoURL || '/default-avatar.png',
              uid: authUser.uid,
              role: userData.role || 'user'
            });
            
            // Bildirim listener'ını başlat
            setupNotificationsListener(authUser.uid);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setIsLoggedIn(false);
        setUser({
          name: '',
          surname: '',
          photoURL: '',
          uid: '',
          role: ''
        });
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupNotificationsListener = (userId: string) => {
    try {
      console.log('🎧 Notification listener kuruluyor...', userId);
      
      // Basit query - sadece userId ile filtreleme (index gerektirmez)
      const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', userId)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('📨 Notification snapshot alındı:', querySnapshot.size, 'bildirim');
        
        const notificationsData: Notification[] = [];
        let unreadCounter = 0;
        
        querySnapshot.forEach((doc) => {
          const notification: Notification = { id: doc.id, ...doc.data() };
          notificationsData.push(notification);
          
          if (!notification.read) {
            unreadCounter++;
          }
          
          // Browser notification göster - triggered kontrolü ile
          if (!notification.read && notification.triggered && !notification.shownInBrowser) {
            showBrowserNotification(notification);
            // Bir kez gösterildi olarak işaretle
            updateDoc(doc.ref, { shownInBrowser: true }).catch(console.error);
          }
        });
        
        // Tarihe göre sırala (client-side)
        notificationsData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        
        setNotifications(notificationsData.slice(0, 10)); // Son 10 bildirimi göster
        setUnreadCount(unreadCounter);
        
        console.log('📊 Bildirim durumu:', {
          total: notificationsData.length,
          unread: unreadCounter
        });
      }, (error) => {
        console.error('❌ Notification listener hatası:', error);
        
        // Hata durumunda 10 saniye sonra tekrar dene
        setTimeout(() => {
          console.log('🔄 Notification listener yeniden başlatılıyor...');
          setupNotificationsListener(userId);
        }, 10000);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Notification listener setup hatası:', error);
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    // Browser notification göster
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotif = new Notification(notification.title || 'Enbal Sigorta', {
          body: notification.message || 'Yeni bildiriminiz var',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `notification-${notification.id}`,
          requireInteraction: true
        });

        browserNotif.onclick = () => {
          window.focus();
          markNotificationAsRead(notification.id);
          router.push('/my-quotes');
          browserNotif.close();
        };

        // 10 saniye sonra otomatik kapat
        setTimeout(() => {
          browserNotif.close();
        }, 10000);

        console.log('🔔 Browser notification gösterildi:', notification.title);
      } catch (error) {
        console.error('Browser notification error:', error);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
      console.log('📖 Bildirim okundu olarak işaretlendi:', notificationId);
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
    }
  };

  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (minutes < 1) return 'Az önce';
      if (minutes < 60) return `${minutes} dk önce`;
      if (hours < 24) return `${hours} sa önce`;
      return `${days} gün önce`;
    } catch (error) {
      console.error('Time formatting error:', error);
      return '';
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
      setDropdownOpen(false);
      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNavClick = (section: string) => {
    if (!isHomePage) {
      router.push(`/#${section}`);
    } else {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Enbal Sigorta
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-purple-600 transition">
              Anasayfa
            </Link>
            
            {isHomePage ? (
              <>
                <button
                  onClick={() => handleNavClick('services')}
                  className="text-gray-700 hover:text-purple-600 transition"
                >
                  Hizmetlerimiz
                </button>
                <button
                  onClick={() => handleNavClick('about')}
                  className="text-gray-700 hover:text-purple-600 transition"
                >
                  Hakkımızda
                </button>
                <button
                  onClick={() => handleNavClick('contact')}
                  className="text-gray-700 hover:text-purple-600 transition"
                >
                  İletişim
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('services')}
                  className="text-gray-700 hover:text-purple-600 transition"
                >
                  Hizmetlerimiz
                </button>
                <button
                  onClick={() => handleNavClick('about')}
                  className="text-gray-700 hover:text-purple-600 transition"
                >
                  Hakkımızda
                </button>
                <button
                  onClick={() => handleNavClick('contact')}
                  className="text-gray-700 hover:text-purple-600 transition"
                >
                  İletişim
                </button>
              </>
            )}

            {!isLoggedIn ? (
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
              >
                Giriş Yap
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Bildirimler - Geliştirilmiş */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 text-gray-700 hover:text-purple-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-10">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-800">
                            Bildirimler {unreadCount > 0 && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full ml-2">
                                {unreadCount} yeni
                              </span>
                            )}
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // Tüm bildirimleri okundu olarak işaretle
                                notifications.filter(n => !n.read).forEach(n => {
                                  markNotificationAsRead(n.id);
                                });
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Tümünü Oku
                            </button>
                            <Link 
                              href="/my-quotes"
                              className="text-purple-600 hover:text-purple-700 text-sm"
                              onClick={() => setNotificationsOpen(false)}
                            >
                              Tümünü Gör
                            </Link>
                          </div>
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                            </svg>
                            Henüz bildiriminiz yok
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                              onClick={() => {
                                markNotificationAsRead(notification.id);
                                setNotificationsOpen(false);
                                router.push('/my-quotes');
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium text-gray-800 truncate ${!notification.read ? 'font-semibold' : ''}`}>
                                    {notification.title || 'Bildirim'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center mt-2">
                                    <p className="text-xs text-gray-400">
                                      {formatNotificationTime(notification.createdAt)}
                                    </p>
                                    {notification.type && (
                                      <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                                        notification.type === 'quote_response' ? 'bg-green-100 text-green-800' :
                                        notification.type === 'quote_rejected' ? 'bg-red-100 text-red-800' :
                                        notification.type === 'document_ready' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {notification.insuranceType || notification.type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Kullanıcı Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                  >
                    <div className="flex items-center space-x-2">
                      {user.photoURL ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={user.photoURL}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="object-cover rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm font-semibold">
                            {user.name && user.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{user.name} {user.surname}</span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50 flex items-center"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil
                      </Link>
                      <Link 
                        href="/my-quotes" 
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50 flex items-center"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Tekliflerim
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      
                      {user.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="block px-4 py-2 text-gray-700 hover:bg-purple-50 flex items-center border-t mt-1 pt-3"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Paneli
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 flex items-center border-t mt-1 pt-3"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>
              Anasayfa
            </Link>
            <button
              onClick={() => handleNavClick('services')}
              className="block text-gray-700 hover:text-purple-600 w-full text-left"
            >
              Hizmetlerimiz
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="block text-gray-700 hover:text-purple-600 w-full text-left"
            >
              Hakkımızda
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="block text-gray-700 hover:text-purple-600 w-full text-left"
            >
              İletişim
            </button>

            {!isLoggedIn ? (
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg"
              >
                Giriş Yap
              </button>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  {user.photoURL ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-semibold">
                        {user.name && user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-gray-700">{user.name} {user.surname}</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <Link
                  href="/profile"
                  className="block text-gray-700 hover:text-purple-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profil
                </Link>
                <Link
                  href="/my-quotes"
                  className="block text-gray-700 hover:text-purple-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tekliflerim
                </Link>
                
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block text-gray-700 hover:text-purple-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Paneli
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg"
                >
                  Çıkış Yap
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}