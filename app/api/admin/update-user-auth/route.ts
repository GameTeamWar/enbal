// app/api/admin/update-user-auth/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Firebase Admin SDK initialization
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
    
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Firebase Admin SDK init error:', error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId, newEmail, newPassword } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating Firebase Auth user:', { userId, newEmail: !!newEmail, newPassword: !!newPassword });

    const adminAuth = getAuth();
    const updateData: any = {};

    // Email güncelleme
    if (newEmail) {
      updateData.email = newEmail;
      console.log('📧 Email güncelleniyor:', newEmail);
    }

    // Şifre güncelleme
    if (newPassword) {
      updateData.password = newPassword;
      console.log('🔑 Şifre güncelleniyor');
    }

    // Kullanıcıyı güncelle
    const userRecord = await adminAuth.updateUser(userId, updateData);
    
    console.log('✅ Firebase Auth user updated successfully:', {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled
      }
    });

  } catch (error: any) {
    console.error('❌ Firebase Auth update error:', error);
    
    let errorMessage = 'Failed to update user';
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'User not found in Firebase Auth';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/email-already-exists':
          errorMessage = 'Email already exists';
          break;
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