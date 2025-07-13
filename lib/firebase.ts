// lib/firebase.ts - Environment Variables ile Firebase Configuration

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Environment değişkenlerinden Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // ✅ enbal-c028e.firebasestorage.app
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Configuration validation
const validateConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('❌ Firebase config eksik alanlar:', missingFields);
    console.error('💡 .env.local dosyasını kontrol edin');
    throw new Error(`Firebase config eksik: ${missingFields.join(', ')}`);
  }
  
  console.log('✅ Firebase config validation başarılı');
  console.log('📦 Storage bucket:', firebaseConfig.storageBucket);
};

// Validate config
validateConfig();

// Firebase App Initialize
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase App initialized successfully');
  console.log('🔧 Environment:', process.env.NODE_ENV);
} catch (error) {
  console.error('❌ Firebase App initialization error:', error);
  throw error;
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Debug information (sadece development'da)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Firebase Services Debug:', {
    authDomain: auth.app.options.authDomain,
    projectId: db.app.options.projectId,
    storageBucket: storage.app.options.storageBucket,
    appName: app.name
  });
}

// Storage connection test function
export const testFirebaseConnection = async () => {
  const results = {
    auth: false,
    firestore: false,
    storage: false,
    errors: [] as string[]
  };

  try {
    // 1. Auth test
    console.log('🔐 Testing Auth...');
    if (auth) {
      results.auth = true;
      console.log('✅ Auth service available');
    }
  } catch (error: any) {
    results.errors.push(`Auth: ${error.message}`);
    console.error('❌ Auth test failed:', error);
  }

  try {
    // 2. Firestore test
    console.log('💾 Testing Firestore...');
    const { collection, getDocs } = await import('firebase/firestore');
    await getDocs(collection(db, 'test'));
    results.firestore = true;
    console.log('✅ Firestore connection successful');
  } catch (error: any) {
    results.errors.push(`Firestore: ${error.message}`);
    console.error('❌ Firestore test failed:', error);
  }

  try {
    // 3. Storage test
    console.log('📦 Testing Storage...');
    const { ref, uploadBytes, deleteObject } = await import('firebase/storage');
    
    const testData = new Blob(['Firebase connection test'], { type: 'text/plain' });
    const testRef = ref(storage, `test/connection-test-${Date.now()}.txt`);
    
    const snapshot = await uploadBytes(testRef, testData);
    console.log('✅ Storage upload successful:', snapshot.ref.fullPath);
    
    // Clean up test file
    await deleteObject(testRef);
    console.log('🧹 Test file cleaned up');
    
    results.storage = true;
  } catch (error: any) {
    results.errors.push(`Storage: ${error.message}`);
    console.error('❌ Storage test failed:', error);
  }

  return results;
};

// Initialize messaging only in browser environment
export const getMessagingInstance = async () => {
  if (typeof window !== 'undefined') {
    try {
      const isMessagingSupported = await isSupported();
      if (isMessagingSupported) {
        return getMessaging(app);
      }
    } catch (error) {
      console.error('Messaging not supported:', error);
    }
  }
  return null;
};

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Global test functions for debugging
  (window as any).testFirebase = testFirebaseConnection;
  (window as any).firebaseConfig = firebaseConfig;
  (window as any).firebaseStorage = storage;
  
  console.log('🔧 Development helpers available:');
  console.log('  - testFirebase() - Test all Firebase services');
  console.log('  - firebaseConfig - View current config');
  console.log('  - firebaseStorage - Access storage instance');
}

export default app;