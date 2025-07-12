'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: '',
    surname: '',
    photoURL: '',
    uid: ''
  });
  type Notification = {
    id: string;
    read?: boolean;
    type?: string;
    insuranceType?: string;
    message?: string;
    createdAt?: any;
    [key: string]: any;
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // User is logged in
        setIsLoggedIn(true);
        
        // Get user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              name: userData.name || '',
              surname: userData.surname || '',
              photoURL: userData.photoURL || '/default-avatar.png',
              uid: authUser.uid
            });
            
            // Setup notifications listener
            setupNotificationsListener(authUser.uid);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        // User is not logged in
        setIsLoggedIn(false);
        setUser({
          name: '',
          surname: '',
          photoURL: '',
          uid: ''
        });
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupNotificationsListener = (userId: string) => {
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: Notification[] = [];
      let unreadCounter = 0;
      
      querySnapshot.forEach((doc) => {
        const notification: Notification = { id: doc.id, ...doc.data() };
        notificationsData.push(notification);
        
        if (!notification.read) {
          unreadCounter++;
        }
      });
      
      setNotifications(notificationsData.slice(0, 10)); // Son 10 bildirim
      setUnreadCount(unreadCounter);
    });

    return unsubscribe;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
    }
  };

  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return '';
    
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
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Enbal Sigorta
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-700 hover:text-purple-600 transition">
              Anasayfa
            </a>
            <a href="#services" className="text-gray-700 hover:text-purple-600 transition">
              Hizmetlerimiz
            </a>
            <a href="#about" className="text-gray-700 hover:text-purple-600 transition">
              Hakkımızda
            </a>
            <a href="#contact" className="text-gray-700 hover:text-purple-600 transition">
              İletişim
            </a>

            {!isLoggedIn ? (
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
              >
                Giriş Yap
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Bildirimler */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 text-gray-700 hover:text-purple-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C7.67 4.165 6 6.388 6 9v3c0 .601-.216 1.182-.595 1.595L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bildirim Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-10">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-800">Bildirimler</h3>
                          <Link 
                            href="/my-quotes"
                            className="text-purple-600 hover:text-purple-700 text-sm"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            Tümünü Gör
                          </Link>
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            Henüz bildiriminiz yok
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                markNotificationAsRead(notification.id);
                                setNotificationsOpen(false);
                                router.push('/my-quotes');
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {notification.type === 'quote_response' ? 'Teklif Cevabı' : 'Teklif Reddedildi'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {notification.insuranceType} - {notification.message?.substring(0, 50)}...
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatNotificationTime(notification.createdAt)}
                                  </p>
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
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profil
                      </Link>
                      <Link 
                        href="/my-quotes" 
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Tekliflerim
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50"
                      >
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
            <a href="#services" className="block text-gray-700 hover:text-purple-600">
              Hizmetlerimiz
            </a>
            <a href="#about" className="block text-gray-700 hover:text-purple-600">
              Hakkımızda
            </a>
            <a href="#contact" className="block text-gray-700 hover:text-purple-600">
              İletişim
            </a>

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