// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBv89xYNDaxaJO7cDmBVPgsXxQRDXp6Dus",
  authDomain: "enbal-c028e.firebaseapp.com",
  projectId: "enbal-c028e",
  storageBucket: "enbal-c028e.firebasestorage.app",
  messagingSenderId: "565874833407",
  appId: "1:565874833407:web:e1e81ff346185a2d8e19ca",
  measurementId: "G-M4EMGQWC8Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Servisleri başlat ve export et
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;