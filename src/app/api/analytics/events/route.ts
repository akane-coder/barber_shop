import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

const ANALYTICS_PATH = path.join(process.cwd(), 'data', 'analytics.json');

async function loadAnalytics(): Promise<AnalyticsData> {
  try {
    const data = await fs.readFile(ANALYTICS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { events: [], last_updated: new Date().toISOString() };
  }
}

async function saveAnalytics(data: AnalyticsData): Promise<void> {
  await fs.writeFile(ANALYTICS_PATH, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const event: Omit<AnalyticsEvent, 'id' | 'timestamp'> = await req.json();
    
    const analytics = await loadAnalytics();
    
    const newEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    
    analytics.events.push(newEvent);
    analytics.last_updated = new Date().toISOString();
    
    // Храним только последние 10000 событий (чтобы файл не разросся)
    if (analytics.events.length > 10000) {
      analytics.events = analytics.events.slice(-10000);
    }
    
    await saveAnalytics(analytics);
    
    return NextResponse.json({ success: true, event_id: newEvent.id });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const analytics = await loadAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics read error:', error);
    return NextResponse.json({ events: [], last_updated: null });
  }
}