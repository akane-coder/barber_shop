import { NextRequest, NextResponse } from 'next/server';
import { runParseYclients } from '@/lib/parse-yclients-logic';

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
    console.log('🔄 Starting sync-all...');
    
    // ВЫЗЫВАЕМ ЛОГИКУ НАПРЯМУЮ, БЕЗ HTTP!
    const result = await runParseYclients(undefined, true);
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      summary: result.summary,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error(' Sync all error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync statuses', 
        details: error instanceof Error ? error.message : 'Unknown' 
      },
      { status: 500 }
    );
  }
}