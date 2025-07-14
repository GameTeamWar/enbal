// hooks/useAuthGuard.ts - Düzeltilmiş ve Geliştirilmiş Versiyon
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface User {
  uid: string;
  role: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  isActive?: boolean; // Optional yapıldı, default true olacak
  [key: string]: any;
}

interface AuthGuardResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (requiredRole: string) => boolean;
  error: string | null;
}

export const useAuthGuard = (requireAuth: boolean = true, requiredRole?: string): AuthGuardResult => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true; // Component mount durumunu takip et

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        // Component unmount olmuşsa işlem yapma
        if (!isMounted) return;

        setError(null); // Hata durumunu temizle

        if (!authUser) {
          // Kullanıcı giriş yapmamış
          console.log('👤 Kullanıcı giriş yapmamış');
          setUser(null);
          setLoading(false);
          
          if (requireAuth) {
            // Giriş gerekiyorsa login sayfasına yönlendir
            console.log('🔄 Login sayfasına yönlendiriliyor...');
            router.push('/login');
          }
          return;
        }

        console.log('🔍 Kullanıcı verisi kontrol ediliyor...', authUser.uid);

        // Firestore'dan kullanıcı verilerini al
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        
        if (!userDoc.exists()) {
          console.error('❌ Firestore\'da kullanıcı verisi bulunamadı!');
          console.log('💡 Kullanıcı muhtemelen kayıt olmamış veya veri eksik');
          
          setUser(null);
          setLoading(false);
          setError('Kullanıcı profili bulunamadı');
          
          if (requireAuth) {
            // Kullanıcı verisi yoksa çıkış yap ve giriş sayfasına yönlendir
            await auth.signOut();
            router.push('/login');
          }
          return;
        }

        const userData = userDoc.data() as User;
        userData.uid = authUser.uid;

        // Email bilgisini Firebase Auth'dan al (Firestore'da yoksa)
        if (!userData.email && authUser.email) {
          userData.email = authUser.email;
        }

        // isActive kontrolü - default true
        const isUserActive = userData.isActive !== false; // undefined veya true ise aktif kabul et

        if (!isUserActive) {
          console.error('❌ Kullanıcı hesabı deaktif!');
          setUser(null);
          setLoading(false);
          setError('Hesabınız deaktif edilmiş');
          
          await auth.signOut();
          router.push('/login');
          return;
        }

        // Rol kontrolü
        if (requiredRole && userData.role !== requiredRole) {
          console.error(`❌ Yetkisiz erişim! Gerekli rol: ${requiredRole}, Kullanıcı rolü: ${userData.role}`);
          console.log('🔄 Ana sayfaya yönlendiriliyor...');
          
          setUser(null);
          setLoading(false);
          setError(`Bu sayfa için ${requiredRole} yetkisi gerekli`);
          
          // Yetkisiz erişim - ana sayfaya yönlendir
          router.push('/');
          return;
        }

        // Başarılı giriş
        console.log('✅ Kullanıcı doğrulandı:', {
          uid: userData.uid,
          name: userData.name,
          role: userData.role,
          phone: userData.phone
        });

        setUser(userData);
        setLoading(false);
        
      } catch (error: any) {
        console.error('❌ Auth guard error:', error);
        
        // Hata türüne göre mesaj belirle
        let errorMessage = 'Kimlik doğrulama hatası';
        
        if (error.code) {
          switch (error.code) {
            case 'permission-denied':
              errorMessage = 'Veritabanı erişim izni reddedildi';
              break;
            case 'network-request-failed':
              errorMessage = 'Ağ bağlantısı hatası';
              break;
            case 'unavailable':
              errorMessage = 'Servis şu anda kullanılamıyor';
              break;
            default:
              errorMessage = `Firebase hatası: ${error.code}`;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        setUser(null);
        setLoading(false);
        setError(errorMessage);
        
        if (requireAuth && isMounted) {
          // Kritik hatalarda login sayfasına yönlendir
          if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
            await auth.signOut();
            router.push('/login');
          }
        }
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [requireAuth, requiredRole, router]);

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hasRole,
    error
  };
};

// Spesifik hook'lar - Geliştirilmiş
export const useAdminGuard = () => {
  const result = useAuthGuard(true, 'admin');
  
  // Admin guard için ek kontroller
  useEffect(() => {
    if (!result.loading && result.isAuthenticated && !result.isAdmin) {
      console.warn('⚠️ Admin olmayan kullanıcı admin sayfasına erişmeye çalıştı');
    }
  }, [result.loading, result.isAuthenticated, result.isAdmin]);
  
  return result;
};

export const useUserGuard = () => {
  return useAuthGuard(true, 'user');
};

// Yeni: Herhangi bir kullanıcı için guard (rol kontrolü yok)
export const useAnyUserGuard = () => {
  return useAuthGuard(true);
};

// Yeni: Authentication durumunu sadece takip et (redirect yok)
export const useAuthState = () => {
  return useAuthGuard(false);
};

// Debug için helper hook
export const useAuthDebug = () => {
  const authState = useAuthState();
  
  useEffect(() => {
    console.log('🔍 Auth Debug State:', {
      isAuthenticated: authState.isAuthenticated,
      isAdmin: authState.isAdmin,
      userRole: authState.user?.role,
      userName: authState.user?.name,
      loading: authState.loading,
      error: authState.error
    });
  }, [authState]);
  
  return authState;
};