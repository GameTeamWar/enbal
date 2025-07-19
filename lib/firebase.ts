// lib/firebase.ts - Environment Variables ile Firebase Configuration

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ✅ Güvenlik önlemi: Console'da Firebase config gizle
const logSecurely = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
  } else {
    // Production'da hassas bilgileri gizle
    const safeMessage = message.replace(/enbal-c028e/g, '[PROJECT_ID]');
    console.log(safeMessage);
  }
};

// Environment değişkenlerinden Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
  
  // ✅ Güvenli loglama
  logSecurely('✅ Firebase config validation başarılı');
  if (process.env.NODE_ENV === 'development') {
    logSecurely('📦 Storage bucket:', firebaseConfig.storageBucket);
  } else {
    logSecurely('📦 Storage bucket: [HIDDEN_FOR_SECURITY]');
  }
};

// Validate config
validateConfig();

// Firebase App Initialize
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  logSecurely('✅ Firebase App initialized successfully');
  logSecurely('🔧 Environment:', process.env.NODE_ENV);
} catch (error) {
  console.error('❌ Firebase App initialization error:', error);
  throw error;
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Development ortamında ek bilgiler
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Firebase services initialized:', {
    auth: '✅ Enabled',
    firestore: '✅ Enabled', 
    storage: '✅ Enabled'
  });
}

export default app;