// app/api/download-document/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { quoteId, documentUrl, fileName } = await request.json();

    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Document URL is required' },
        { status: 400 }
      );
    }

    console.log('API: Dosya indirme başlıyor:', { quoteId, documentUrl, fileName });

    // Firebase Storage URL'ini doğrudan fetch et
    const response = await fetch(documentUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Enbal-Sigorta-API/1.0',
      },
    });

    if (!response.ok) {
      console.error('Firebase Storage fetch failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Storage fetch failed: ${response.status}` },
        { status: response.status }
      );
    }

    // Content-Type'ı al
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    console.log('Content-Type:', contentType);

    // Stream olarak al
    const arrayBuffer = await response.arrayBuffer();
    console.log('File size:', arrayBuffer.byteLength, 'bytes');

    // Güvenli dosya adı oluştur
    const safeFileName = fileName ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_') : 'document.pdf';

    // Response headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${safeFileName}"`);
    headers.set('Content-Length', arrayBuffer.byteLength.toString());
    headers.set('Cache-Control', 'no-cache');
    
    // CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    console.log('API: Dosya başarıyla gönderiliyor');

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: headers,
    });

  } catch (error: any) {
    console.error('Download API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Download failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}