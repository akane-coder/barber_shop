import { NextRequest, NextResponse } from 'next/server';

function getSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!getSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // ИСПОЛЬЗУЕМ ОТНОСИТЕЛЬНЫЙ ПУТЬ для Cloudflare Workers
    const res = await fetch(new URL('/api/parse-yclients', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncAll: true }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Parse error response:', errorText);
      throw new Error(errorText || 'Parser failed');
    }
    
    const data = await res.json();
    return NextResponse.json({
      success: true,
      data: data.data,
      summary: data.summary,
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error('❌ Sync all error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync statuses', 
        details: error instanceof Error ? error.message : 'Unknown' 
      },
      { status: 500 }
    );
  }
}