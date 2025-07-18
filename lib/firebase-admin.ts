import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const apps = getApps();

let adminApp;

if (apps.length === 0) {
  // Firebase Admin SDK yapılandırması
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'enbal-sigorta',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-xyz@enbal-sigorta.iam.gserviceaccount.com',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
  };

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId
  });
} else {
  adminApp = apps[0];
}

export const adminDb = getFirestore(adminApp);
