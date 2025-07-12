// lib/firebase.ts - Düzeltilmiş Firebase Configuration
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBv89xYNDaxaJO7cDmBVPgsXxQRDXp6Dus",
  authDomain: "enbal-c028e.firebaseapp.com",
  projectId: "enbal-c028e",
  storageBucket: "enbal-c028e.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "565874833407",
  appId: "1:565874833407:web:e1e81ff346185a2d8e19ca",
  measurementId: "G-M4EMGQWC8Z"
};

// Initialize Firebase - Duplicate app kontrolü ile
let app;
try {
  // Eğer zaten bir app varsa onu kullan, yoksa yeni oluştur
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback: mevcut app'i kullan
  app = getApp();
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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

export default app;