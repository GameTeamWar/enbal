// hooks/useAuthGuard.ts
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
  isActive: boolean;
  [key: string]: any;
}

interface AuthGuardResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (requiredRole: string) => boolean;
}

export const useAuthGuard = (requireAuth: boolean = true, requiredRole?: string): AuthGuardResult => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (!authUser) {
          // Kullanıcı giriş yapmamış
          setUser(null);
          setLoading(false);
          
          if (requireAuth) {
            // Giriş gerekiyorsa login sayfasına yönlendir
            router.push('/login');
          }
          return;
        }

        // Firestore'dan kullanıcı verilerini al
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        
        if (!userDoc.exists()) {
          console.error('Kullanıcı verisi bulunamadı!');
          setUser(null);
          setLoading(false);
          
          if (requireAuth) {
            // Kullanıcı verisi yoksa çıkış yap ve giriş sayfasına yönlendir
            await auth.signOut();
            router.push('/login');
          }
          return;
        }

        const userData = userDoc.data() as User;
        userData.uid = authUser.uid;

        // Kullanıcı aktif mi kontrol et
        if (!userData.isActive) {
          console.error('Kullanıcı hesabı deaktif!');
          setUser(null);
          setLoading(false);
          
          await auth.signOut();
          router.push('/login');
          return;
        }

        // Rol kontrolü
        if (requiredRole && userData.role !== requiredRole) {
          console.error(`Yetkisiz erişim! Gerekli rol: ${requiredRole}, Kullanıcı rolü: ${userData.role}`);
          setUser(null);
          setLoading(false);
          
          // Yetkisiz erişim - ana sayfaya yönlendir
          router.push('/');
          return;
        }

        setUser(userData);
        setLoading(false);
        
      } catch (error) {
        console.error('Auth guard error:', error);
        setUser(null);
        setLoading(false);
        
        if (requireAuth) {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [requireAuth, requiredRole, router]);

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hasRole
  };
};

// Spesifik hook'lar
export const useAdminGuard = () => {
  return useAuthGuard(true, 'admin');
};

export const useUserGuard = () => {
  return useAuthGuard(true, 'user');
};