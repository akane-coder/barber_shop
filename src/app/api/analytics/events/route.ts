import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/kv';

interface AnalyticsEvent {
  id: string;
  timestamp: string;
  type: 'visit' | 'master_click' | 'book_click' | 'yclients_open';
  data: {
    url?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    master_id?: string;
    master_name?: string;
    device?: 'mobile' | 'desktop' | 'tablet';
    user_agent?: string;
  };
}

interface AnalyticsData {
  events: AnalyticsEvent[];
  last_updated: string;
}

export async function POST(req: NextRequest) {
  try {
    const eventData: Omit<AnalyticsEvent, 'id' | 'timestamp'> = await req.json();

    // 1. Получаем текущие данные (или создаем пустые, если их нет)
    const currentData = (await getData<AnalyticsData>('analytics_data')) || {
      events: [],
      last_updated: new Date().toISOString(),
    };

    // 2. Формируем новое событие
    const newEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      ...eventData,
    };

    // 3. Добавляем событие в массив
    currentData.events.push(newEvent);
    currentData.last_updated = new Date().toISOString();

    // 4. ВАЖНО: Храним только последние 10 000 событий, 
    // чтобы не превысить лимиты размера KV (128 КБ на ключ) и не замедлять чтение
    if (currentData.events.length > 10000) {
      currentData.events = currentData.events.slice(-10000);
    }

    // 5. Сохраняем обратно (в Cloudflare KV или локально в fs)
    await setData('analytics_data', currentData);

    return NextResponse.json({ success: true, event_id: newEvent.id });
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Получаем данные для отладки или админки
    const data = await getData<AnalyticsData>('analytics_data');
    
    if (!data) {
      return NextResponse.json({ events: [], last_updated: null });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}