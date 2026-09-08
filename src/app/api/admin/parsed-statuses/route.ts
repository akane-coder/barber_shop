import { NextResponse } from 'next/server';
import { getData } from '@/lib/kv';

export async function GET() {
  try {
    // ЧИТАЕМ ИЗ KV ВМЕСТО ФАЙЛА
    const cacheData = await getData<any>('parsed_statuses_cache');
    
    const parsed = cacheData || { statuses: {}, timestamp: null, errors: [] };
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('❌ Ошибка чтения статусов:', error);
    return NextResponse.json({ statuses: {}, timestamp: null, errors: [] });
  }
}