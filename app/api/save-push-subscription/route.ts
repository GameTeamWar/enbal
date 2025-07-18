import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('📝 Push subscription API called');

    const { userId, subscription } = await request.json();

    if (!userId || !subscription) {
      return NextResponse.json({ 
        success: false, 
        message: 'userId ve subscription gerekli',
        error: 'missing_parameters'
      }, { status: 400 });
    }

    console.log('📝 Push subscription request received:', {
      userId: userId.substring(0, 8) + '...',
      hasSubscription: !!subscription
    });

    // ✅ For now, always suggest fallback due to Firestore permission issues
    // This allows the client-side to handle storage properly
    console.log('⚠️ Suggesting client-side fallback due to permission constraints');
    
    return NextResponse.json({ 
      success: false, 
      message: 'Server kaydetme devre dışı - client-side storage kullanın',
      error: 'permission_denied',
      fallback: true,
      timestamp: new Date().toISOString()
    }, { status: 403 });

  } catch (error: any) {
    console.error('❌ Push subscription API error:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'API hatası',
      error: 'api_error',
      fallback: true,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Push subscription API aktif',
    mode: 'fallback_only',
    timestamp: new Date().toISOString()
  });
}
