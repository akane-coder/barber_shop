import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ANALYTICS_PATH = path.join(process.cwd(), 'data', 'analytics.json');

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
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    const data = await fs.readFile(ANALYTICS_PATH, 'utf-8');
    const analytics: { events: AnalyticsEvent[] } = JSON.parse(data);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentEvents = analytics.events.filter(
      e => new Date(e.timestamp) >= cutoffDate
    );
    
    // Посещения по дням
    const visitsByDay: Record<string, number> = {};
    recentEvents
      .filter(e => e.type === 'visit')
      .forEach(e => {
        const day = e.timestamp.split('T')[0];
        visitsByDay[day] = (visitsByDay[day] || 0) + 1;
      });
    
    // Источники трафика
    const sources: Record<string, number> = {};
    recentEvents
      .filter(e => e.type === 'visit' && e.data.utm_source)
      .forEach(e => {
        const source = e.data.utm_source || 'direct';
        sources[source] = (sources[source] || 0) + 1;
      });
    
    // Устройства
    const devices: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    recentEvents
      .filter(e => e.type === 'visit' && e.data.device)
      .forEach(e => {
        const device = e.data.device || 'desktop';
        devices[device] = (devices[device] || 0) + 1;
      });
    
    // Популярные мастера
    const masters: Record<string, { name: string; clicks: number }> = {};
    recentEvents
      .filter(e => e.type === 'master_click' && e.data.master_name)
      .forEach(e => {
        const name = e.data.master_name!;
        if (!masters[name]) masters[name] = { name, clicks: 0 };
        masters[name].clicks++;
      });
    
    // Конверсия
    const visits = recentEvents.filter(e => e.type === 'visit').length;
    const masterClicks = recentEvents.filter(e => e.type === 'master_click').length;
    const bookClicks = recentEvents.filter(e => e.type === 'book_click').length;
    const yclientsOpens = recentEvents.filter(e => e.type === 'yclients_open').length;
    
    return NextResponse.json({
      period: { days, from: cutoffDate.toISOString(), to: new Date().toISOString() },
      summary: {
        visits,
        masterClicks,
        bookClicks,
        yclientsOpens,
        conversionRate: visits > 0 ? ((bookClicks / visits) * 100).toFixed(2) : '0',
      },
      visitsByDay,
      sources,
      devices,
      topMasters: Object.values(masters).sort((a, b) => b.clicks - a.clicks).slice(0, 5),
      recentEvents: recentEvents.slice(-20).reverse(),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}