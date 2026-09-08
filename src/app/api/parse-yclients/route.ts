import { NextRequest, NextResponse } from 'next/server';
import { runParseYclients } from '@/lib/parse-yclients-logic';
import { getData } from '@/lib/kv';

export async function POST(req: NextRequest) {
  try {
    const { staffIds, syncAll } = await req.json();
    const result = await runParseYclients(staffIds, syncAll);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(' Error in parse-yclients:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cacheData = await getData<any>('parsed_statuses_cache');
    const parsed = cacheData || { statuses: {}, timestamp: null, errors: [] };
    
    return NextResponse.json({
      message: 'YClients Parser API',
      organization_id: 262700,
      cached_statuses: parsed.statuses || {},
      last_updated: parsed.timestamp,
      errors: parsed.errors || [],
      has_token: !!process.env.YCLIENTS_API_TOKEN,
    });
  } catch (error) {
    console.error('❌ Error reading cache:', error);
    return NextResponse.json({
      message: 'YClients Parser API',
      organization_id: 262700,
      cached_statuses: {},
      last_updated: null,
      errors: [],
      has_token: !!process.env.YCLIENTS_API_TOKEN,
    });
  }
}