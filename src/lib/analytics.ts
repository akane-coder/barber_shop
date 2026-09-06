type EventType = 'visit' | 'master_click' | 'book_click' | 'yclients_open';

interface EventData {
  url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  master_id?: string;
  master_name?: string;
  device?: 'mobile' | 'desktop' | 'tablet';
}

function getDevice(): 'mobile' | 'desktop' | 'tablet' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getUTMParams(): Partial<EventData> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
}

export async function trackEvent(type: EventType, data: EventData = {}): Promise<void> {
  try {
    const event = {
      type,
      data: {
        url: window.location.href,
        referrer: document.referrer || undefined,
        device: getDevice(),
        ...getUTMParams(),
        ...data,
      },
    };
    
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Отслеживание посещения страницы
export function trackVisit(): void {
  // Отслеживаем только один раз за сессию
  if (sessionStorage.getItem('visit_tracked')) return;
  sessionStorage.setItem('visit_tracked', 'true');
  trackEvent('visit');
}

// Отслеживание клика по мастеру
export function trackMasterClick(masterId: string, masterName: string): void {
  trackEvent('master_click', { master_id: masterId, master_name: masterName });
}

// Отслеживание клика "Записаться"
export function trackBookClick(): void {
  trackEvent('book_click');
}

// Отслеживание открытия виджета YClients
export function trackYClientsOpen(): void {
  trackEvent('yclients_open');
}