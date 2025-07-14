// app/api/admin/delete-user/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Firebase Admin SDK initialization (aynı config)
if (!getApps().length) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    initializeApp({
      credential: cert(serviceAccount as any),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    console.log('✅ Firebase Admin SDK initialized for user deletion');
  } catch (error) {
    console.error('❌ Firebase Admin SDK init error:', error);
  }
}

export async function POST(request: Request) {
  let userId: string | undefined;
  
  try {
    const requestData = await request.json();
    userId = requestData.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting Firebase Auth user:', userId);

    const adminAuth = getAuth();
    
    // Kullanıcıyı Firebase Auth'tan sil
    await adminAuth.deleteUser(userId);
    
    console.log('✅ Firebase Auth user deleted successfully:', userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully from Firebase Auth',
      deletedUserId: userId
    });

  } catch (error: any) {
    console.error('❌ Firebase Auth delete error:', error);
    
    let errorMessage = 'Failed to delete user from Firebase Auth';
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          // Kullanıcı Auth'ta yoksa da başarılı say
          console.log('⚠️ User not found in Firebase Auth (already deleted)');
          return NextResponse.json({
            success: true,
            message: 'User was not in Firebase Auth (already deleted)',
            deletedUserId: userId || 'unknown'
          });
        default:
          errorMessage = `Firebase Auth error: ${error.code}`;
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: error.code || 'unknown'
      },
      { status: 500 }
    );
  }
}