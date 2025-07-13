// scripts/validate-env.js - Environment Variables Doğrulama

const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'EMAIL_USER',
  'EMAIL_PASS',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_APP_NAME'
];

const validateEnvironmentVariables = () => {
  console.log('🔍 Environment Variables Validation\n');
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local dosyası bulunamadı!');
    console.log('💡 Lütfen .env.local dosyası oluşturun ve gerekli değişkenleri ekleyin.');
    process.exit(1);
  }
  
  console.log('✅ .env.local dosyası mevcut\n');
  
  // Load environment variables
  require('dotenv').config({ path: envPath });
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  console.log('📋 Required Environment Variables:');
  console.log('==========================================');
  
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      console.log(`❌ ${varName}: MISSING OR EMPTY`);
      hasErrors = true;
    } else {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('API_KEY') || varName.includes('PRIVATE')) {
        displayValue = value.substring(0, 10) + '...[MASKED]';
      }
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });
  
  // Check optional variables
  console.log('\n📋 Optional Environment Variables:');
  console.log('==========================================');
  
  OPTIONAL_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      console.log(`⚠️  ${varName}: NOT SET`);
      hasWarnings = true;
    } else {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('PASS') || varName.includes('SECRET') || varName.includes('PRIVATE')) {
        displayValue = '[PASSWORD/SECRET SET]';
      } else if (varName.includes('EMAIL')) {
        displayValue = value.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      } else if (value.length > 50) {
        displayValue = value.substring(0, 30) + '...[TRUNCATED]';
      }
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });
  
  // Firebase-specific validations
  console.log('\n🔧 Firebase Configuration Validation:');
  console.log('==========================================');
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  // Project ID validation
  if (projectId) {
    if (projectId === 'enbal-c028e') {
      console.log('✅ Project ID doğru: enbal-c028e');
    } else {
      console.log(`⚠️  Project ID farklı: ${projectId}`);
    }
  }
  
  // Storage bucket validation
  if (storageBucket) {
    if (storageBucket.includes('.firebasestorage.app')) {
      console.log('✅ Storage bucket format doğru (.firebasestorage.app)');
    } else if (storageBucket.includes('.appspot.com')) {
      console.log('⚠️  Storage bucket eski format (.appspot.com) - güncellemeyi düşünün');
      hasWarnings = true;
    } else {
      console.log('❌ Storage bucket format tanımsız');
      hasErrors = true;
    }
  }
  
  // Auth domain validation
  if (authDomain) {
    if (authDomain.includes('.firebaseapp.com')) {
      console.log('✅ Auth domain format doğru (.firebaseapp.com)');
    } else {
      console.log('❌ Auth domain format hatalı');
      hasErrors = true;
    }
  }
  
  // API key validation
  if (apiKey) {
    if (apiKey.startsWith('AIza') && apiKey.length > 30) {
      console.log('✅ API key format doğru');
    } else {
      console.log('❌ API key format hatalı veya çok kısa');
      hasErrors = true;
    }
  }
  
  // Email configuration validation
  console.log('\n📧 Email Configuration:');
  console.log('==========================================');
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (emailUser && emailPass) {
    console.log('✅ Email configuration complete');
    if (emailUser.includes('@gmail.com')) {
      console.log('ℹ️  Gmail SMTP kullanılıyor - App Password gerekli olabilir');
    }
  } else {
    console.log('⚠️  Email configuration incomplete - admin notifications çalışmayabilir');
    hasWarnings = true;
  }
  
  // Generate Firebase config preview
  console.log('\n🔧 Firebase Config Preview:');
  console.log('==========================================');
  console.log(JSON.stringify({
    apiKey: apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING',
    authDomain: authDomain || 'MISSING',
    projectId: projectId || 'MISSING',
    storageBucket: storageBucket || 'MISSING',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'MISSING',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 
           process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 30) + '...' : 'MISSING'
  }, null, 2));
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log('==========================================');
  
  if (hasErrors) {
    console.log('❌ HATA: Kritik environment variables eksik!');
    console.log('💡 Lütfen eksik değişkenleri .env.local dosyasına ekleyin.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  UYARI: Bazı opsiyonel değişkenler eksik, ancak sistem çalışabilir.');
    console.log('💡 Tam işlevsellik için eksik değişkenleri ekleyebilirsiniz.');
  } else {
    console.log('✅ TÜM KONTROLLERDEN GEÇTİ! Environment variables hazır.');
  }
  
  console.log('\n🚀 Sistem başlatılabilir: npm run dev');
  console.log('🔍 Test için: Browser console\'da testFirebase() çalıştırın\n');
};

// Run validation
validateEnvironmentVariables();