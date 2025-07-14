// hooks/useAuthGuard.ts - Fixed version to prevent infinite re-renders
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface User {
  uid: string;
  role: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  isActive?: boolean;
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
  
  // Use refs to prevent infinite re-renders
  const requireAuthRef = useRef(requireAuth);
  const requiredRoleRef = useRef(requiredRole);
  const hasRedirectedRef = useRef(false);
  
  // Update refs when props change
  requireAuthRef.current = requireAuth;
  requiredRoleRef.current = requiredRole;

  // Memoized redirect function to prevent infinite re-renders
  const handleRedirect = useCallback((path: string) => {
    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      console.log(`🔄 Redirecting to: ${path}`);
      router.push(path);
    }
  }, [router]);

  // Memoized role checker
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user?.role]);

  useEffect(() => {
    let isMounted = true;
    hasRedirectedRef.current = false; // Reset redirect flag

    const unsubscribe = onAuthStateChanged(auth, async (authUser: FirebaseUser | null) => {
      try {
        if (!isMounted) return;

        setError(null);

        if (!authUser) {
          console.log('👤 User not authenticated');
          setUser(null);
          setLoading(false);
          
          if (requireAuthRef.current) {
            handleRedirect('/login');
          }
          return;
        }

        console.log('🔍 Checking user data...', authUser.uid);

        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        
        if (!userDoc.exists()) {
          console.error('❌ User data not found in Firestore');
          setUser(null);
          setLoading(false);
          setError('User profile not found');
          
          if (requireAuthRef.current) {
            await auth.signOut();
            handleRedirect('/login');
          }
          return;
        }

        const userData = userDoc.data() as User;
        userData.uid = authUser.uid;

        if (!userData.email && authUser.email) {
          userData.email = authUser.email;
        }

        const isUserActive = userData.isActive !== false;

        if (!isUserActive) {
          console.error('❌ User account is inactive');
          setUser(null);
          setLoading(false);
          setError('Account is inactive');
          
          await auth.signOut();
          handleRedirect('/login');
          return;
        }

        if (requiredRoleRef.current && userData.role !== requiredRoleRef.current) {
          console.error(`❌ Unauthorized access! Required: ${requiredRoleRef.current}, User: ${userData.role}`);
          setUser(null);
          setLoading(false);
          setError(`${requiredRoleRef.current} role required`);
          
          handleRedirect('/');
          return;
        }

        console.log('✅ User authenticated:', {
          uid: userData.uid,
          name: userData.name,
          role: userData.role,
          phone: userData.phone
        });

        if (isMounted) {
          setUser(userData);
          setLoading(false);
        }
        
      } catch (error: any) {
        console.error('❌ Auth guard error:', error);
        
        if (!isMounted) return;

        let errorMessage = 'Authentication error';
        
        if (error.code) {
          switch (error.code) {
            case 'permission-denied':
              errorMessage = 'Database access denied';
              break;
            case 'network-request-failed':
              errorMessage = 'Network connection error';
              break;
            case 'unavailable':
              errorMessage = 'Service temporarily unavailable';
              break;
            default:
              errorMessage = `Firebase error: ${error.code}`;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        setUser(null);
        setLoading(false);
        setError(errorMessage);
        
        if (requireAuthRef.current && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
          await auth.signOut();
          handleRedirect('/login');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Empty dependency array to prevent infinite re-renders

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hasRole,
    error
  };
};

// Specific hooks with stable parameters
export const useAdminGuard = (): AuthGuardResult => {
  return useAuthGuard(true, 'admin');
};

export const useUserGuard = (): AuthGuardResult => {
  return useAuthGuard(true, 'user');
};

export const useAnyUserGuard = (): AuthGuardResult => {
  return useAuthGuard(true);
};

export const useAuthState = (): AuthGuardResult => {
  return useAuthGuard(false);
};