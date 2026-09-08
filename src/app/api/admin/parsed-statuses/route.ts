import { NextResponse } from 'next/server';
import { getData } from '@/lib/kv';

export async function GET() {
  try {
    // ЧИТАЕМ КЭШ ИЗ KV ВМЕСТО ФАЙЛОВОЙ СИСТЕМЫ
    const cacheData = await getData<any>('parsed_statuses_cache');
    
    // Если данных ещё нет (первый запуск), возвращаем безопасную структуру по умолчанию
    const parsed = cacheData || { statuses: {}, timestamp: null, errors: [] };
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('❌ Ошибка чтения статусов из KV:', error);
    // Возвращаем пустую структуру, чтобы админка не падала при ошибке
    return NextResponse.json({ statuses: {}, timestamp: null, errors: [] });
  }
}