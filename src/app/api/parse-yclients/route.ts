import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ORGANIZATION_ID = 262700;
const YCLIENTS_BASE_URL = 'https://platform.yclients.com';
const API_TOKEN = process.env.YCLIENTS_API_TOKEN || 'Bearer gtcwf654agufy25gsadh';

interface TimeSlot {
  id: string;
  datetime: string;
  time: string;
  is_bookable: boolean;
}

interface ParsedResult {
  staff_id: number;
  status: string | null;
  slots_count: number;
  next_available: string | null;
  error?: string;
  source: 'api' | 'unknown';
}

// Запрашиваем слоты на ОДНУ дату
async function fetchSlotsForDate(staffId: number, date: string): Promise<TimeSlot[]> {
  try {
    const response = await fetch(`${YCLIENTS_BASE_URL}/api/v1/b2c/booking/availability/search-timeslots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': API_TOKEN,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://b270235.yclients.com',
        'Referer': `https://b270235.yclients.com/company/${ORGANIZATION_ID}/personal/select-master`,
      },
      body: JSON.stringify({
        context: { location_id: ORGANIZATION_ID },
        filter: {
          date: date,
          records: [{ staff_id: staffId, attendance_service_items: [] }],
        },
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ API error for staff ${staffId} on ${date}: ${response.status}`);
      return [];
    }

    const rawData = await response.json();
    
    // JSON:API формат: data[].attributes
    if (Array.isArray(rawData.data) && rawData.data.length > 0) {
      return rawData.data.map((item: any) => ({
        id: item.id,
        datetime: item.attributes?.datetime || item.attributes?.start_datetime,
        time: item.attributes?.time,
        is_bookable: item.attributes?.is_bookable !== false,
      }));
    }
    
    return [];
  } catch (error) {
    console.error(` Network error for staff ${staffId} on ${date}:`, error);
    return [];
  }
}

// Запрашиваем слоты на НЕСКОЛЬКО дней вперёд
async function fetchMasterSlotsMultiDay(staffId: number, daysCount: number = 4): Promise<{ slots: TimeSlot[]; firstAvailableDate: string | null }> {
  const allSlots: TimeSlot[] = [];
  let firstAvailableDate: string | null = null;
  
  const today = new Date();
  
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const daySlots = await fetchSlotsForDate(staffId, dateStr);
    const bookableSlots = daySlots.filter(s => s.is_bookable);
    
    if (bookableSlots.length > 0 && !firstAvailableDate) {
      firstAvailableDate = dateStr;
    }
    
    allSlots.push(...daySlots);
  }
  
  return { slots: allSlots, firstAvailableDate };
}

function calculateMasterStatus(slots: TimeSlot[]): string {
  const now = new Date();
  const minskTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Minsk' }));
  const nowPlus2Hours = new Date(minskTime.getTime() + 2 * 60 * 60 * 1000);

  const todayEnd = new Date(minskTime);
  todayEnd.setHours(23, 59, 59, 999);

  const tomorrow = new Date(minskTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const in2Days = new Date(tomorrow);
  in2Days.setDate(in2Days.getDate() + 1);

  const in3Days = new Date(in2Days);
  in3Days.setDate(in3Days.getDate() + 1);

  const in4Days = new Date(in3Days);
  in4Days.setDate(in4Days.getDate() + 1);

  let hasSlotToday = false;
  let hasSlotTomorrow = false;
  let hasSlotIn2Days = false;
  let hasSlotIn3_4Days = false;

  for (const slot of slots) {
    if (!slot.is_bookable) continue;

    const slotTime = new Date(slot.datetime);

    // 🟢 Свободен сейчас (в ближайшие 2 часа)
    if (slotTime >= minskTime && slotTime <= nowPlus2Hours) {
      return 'IMMEDIATE';
    }
    // 🟡 Есть сегодня
    if (slotTime >= minskTime && slotTime <= todayEnd) {
      hasSlotToday = true;
    }
    // 🔵 Есть завтра
    if (slotTime >= tomorrow && slotTime <= tomorrowEnd) {
      hasSlotTomorrow = true;
    }
    // 🔵 Есть послезавтра
    if (slotTime >= in2Days && slotTime < in3Days) {
      hasSlotIn2Days = true;
    }
    // ⚪ Высокая загрузка (3-4 дня)
    if (slotTime >= in3Days && slotTime < in4Days) {
      hasSlotIn3_4Days = true;
    }
  }

  if (hasSlotToday) return 'TODAY';
  if (hasSlotTomorrow) return 'TOMORROW';
  if (hasSlotIn2Days) return 'IN_2_DAYS';
  if (hasSlotIn3_4Days) return 'IN_3_4_DAYS';
  return 'FULLY_BOOKED';
}

export async function POST(req: NextRequest) {
  try {
    const { staffIds, syncAll } = await req.json();

    let idsToSync: number[] = staffIds || [];

    if (syncAll) {
      try {
        const barbersPath = path.join(process.cwd(), 'data', 'barbers.json');
        const barbersData = await fs.readFile(barbersPath, 'utf-8');
        const barbers = JSON.parse(barbersData);
        idsToSync = barbers
          .filter((b: any) => b.is_active && b.yclients_staff_id)
          .map((b: any) => b.yclients_staff_id);
        console.log(` Syncing ${idsToSync.length} active masters:`, idsToSync);
      } catch (err) {
        console.error('❌ Error loading barbers for sync:', err);
      }
    }

    if (!Array.isArray(idsToSync) || idsToSync.length === 0) {
      return NextResponse.json({ error: 'No staff IDs to sync' }, { status: 400 });
    }

    console.log(`🔍 Parsing slots for next 4 days...`);

    if (!API_TOKEN) {
      console.error('❌ No API token available');
      const results: ParsedResult[] = idsToSync.map(staffId => ({
        staff_id: staffId,
        status: null,
        slots_count: 0,
        next_available: null,
        error: 'No API token',
        source: 'unknown' as const,
      }));
      return NextResponse.json({ success: false, data: results });
    }

    console.log('✅ Using token for API requests');

    const results: ParsedResult[] = await Promise.all(
      idsToSync.map(async (staffId) => {
        console.log(`\n👤 Processing staff ${staffId}...`);

        // Запрашиваем слоты на 4 дня вперёд
        const { slots, firstAvailableDate } = await fetchMasterSlotsMultiDay(staffId, 4);
        
        const bookableSlots = slots.filter(s => s.is_bookable);
        const status = bookableSlots.length > 0 ? calculateMasterStatus(slots) : 'FULLY_BOOKED';

        console.log(`✅ Success: ${bookableSlots.length} bookable slots, first available: ${firstAvailableDate || 'none'}, status: ${status}`);

        return {
          staff_id: staffId,
          status,
          slots_count: bookableSlots.length,
          next_available: firstAvailableDate,
          source: 'api' as const,
        };
      })
    );

    const cacheData = {
      statuses: results.reduce((acc, r) => {
        if (r.status) {
          acc[r.staff_id] = r;
        }
        return acc;
      }, {} as Record<number, ParsedResult>),
      timestamp: new Date().toISOString(),
      errors: results.filter(r => r.error).map(r => ({ staff_id: r.staff_id, error: r.error })),
    };

    try {
      const cachePath = path.join(process.cwd(), 'data', 'parsed-statuses.json');
      await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
      console.log('💾 Cached statuses saved');
    } catch (err) {
      console.error('❌ Error saving cache:', err);
    }

    console.log('\n✅ Sync completed!');
    return NextResponse.json({
      success: true,
      data: results,
      timestamp: cacheData.timestamp,
      summary: {
        total: results.length,
        success: results.filter(r => r.status).length,
        failed: results.filter(r => r.error).length,
      },
    });
  } catch (error) {
    console.error('❌ Error in parse-yclients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cachePath = path.join(process.cwd(), 'data', 'parsed-statuses.json');
    const cacheData = await fs.readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(cacheData);

    return NextResponse.json({
      message: 'YClients Parser API',
      organization_id: ORGANIZATION_ID,
      cached_statuses: parsed.statuses || {},
      last_updated: parsed.timestamp,
      errors: parsed.errors || [],
      has_token: !!API_TOKEN,
    });
  } catch {
    return NextResponse.json({
      message: 'YClients Parser API',
      organization_id: ORGANIZATION_ID,
      cached_statuses: {},
      last_updated: null,
      errors: [],
      has_token: !!API_TOKEN,
    });
  }
}