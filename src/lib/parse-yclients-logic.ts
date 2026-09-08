import { getData, setData } from '@/lib/kv';
import { Barber } from '@/types';

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

async function fetchMasterSlotsMultiDay(staffId: number, daysCount: number = 4): Promise<{ slots: TimeSlot[]; firstAvailableDate: string | null }> {
  const allSlots: TimeSlot[] = [];
  let firstAvailableDate: string | null = null;
  
  // ✅ ИСПОЛЬЗУЕМ ВРЕМЯ МИНСКА ВМЕСТО UTC
  const now = new Date();
  const minskTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Minsk' }));
  
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(minskTime);
    date.setDate(date.getDate() + i);
    
    // ✅ ФОРМАТИРУЕМ ДАТУ В МИНСКОМ ВРЕМЕНИ
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
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
  // ✅ ПРАВИЛЬНОЕ ПОЛУЧЕНИЕ ВРЕМЕНИ МИНСКА (UTC+3)
  const now = new Date();
  const minskOffsetMs = 3 * 60 * 60 * 1000; // UTC+3 в миллисекундах
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const minskNowMs = utcMs + minskOffsetMs;
  
  const nowPlus2HoursMs = minskNowMs + 2 * 60 * 60 * 1000;
  
  // ✅ ВЫЧИСЛЯЕМ НАЧАЛО ДНЯ В МИНСКЕ (работает на Cloudflare UTC)
  // Берём timestamp Минска, обнуляем время до начала дня, потом конвертируем обратно в UTC timestamp
  const minskDate = new Date(minskNowMs);
  const dayStartMinskMs = Date.UTC(
    minskDate.getUTCFullYear(),
    minskDate.getUTCMonth(),
    minskDate.getUTCDate(),
    0, 0, 0, 0
  );
  
  // Сегодня: от начала дня в Минске до +24 часа
  const todayStartMs = dayStartMinskMs;
  const todayEndMs = dayStartMinskMs + 24 * 60 * 60 * 1000 - 1;
  
  // Завтра
  const tomorrowStartMs = dayStartMinskMs + 24 * 60 * 60 * 1000;
  const tomorrowEndMs = tomorrowStartMs + 24 * 60 * 60 * 1000 - 1;
  
  // Послезавтра
  const in2DaysStartMs = tomorrowStartMs + 24 * 60 * 60 * 1000;
  const in2DaysEndMs = in2DaysStartMs + 24 * 60 * 60 * 1000 - 1;
  
  // 3-4 дня
  const in3DaysStartMs = in2DaysStartMs + 24 * 60 * 60 * 1000;
  const in4DaysEndMs = in3DaysStartMs + 2 * 24 * 60 * 60 * 1000 - 1;
  
  console.log('🕐 Minsk now (ms):', minskNowMs, '->', new Date(minskNowMs).toISOString());
  console.log('📅 Today:', new Date(todayStartMs).toISOString(), '-', new Date(todayEndMs).toISOString());
  console.log('📅 Tomorrow:', new Date(tomorrowStartMs).toISOString(), '-', new Date(tomorrowEndMs).toISOString());
  console.log('📅 In 2 days:', new Date(in2DaysStartMs).toISOString(), '-', new Date(in2DaysEndMs).toISOString());
  
  let hasSlotToday = false;
  let hasSlotTomorrow = false;
  let hasSlotIn2Days = false;
  let hasSlotIn3_4Days = false;
  
  for (const slot of slots) {
    if (!slot.is_bookable) continue;
    
    // ✅ ПАРСИМ СЛОТ С УЧЁТОМ TIMEZONE (datetime уже содержит +03:00)
    const slotTimeMs = new Date(slot.datetime).getTime();
    
    console.log(`🔍 Slot: ${slot.datetime} -> ${new Date(slotTimeMs).toISOString()} (ms: ${slotTimeMs})`);
    
    // Если слот в ближайшие 2 часа от текущего момента в Минске
    if (slotTimeMs >= minskNowMs && slotTimeMs <= nowPlus2HoursMs) {
      console.log('✅ IMMEDIATE');
      return 'IMMEDIATE';
    }
    // Сегодня
    if (slotTimeMs >= todayStartMs && slotTimeMs <= todayEndMs) {
      hasSlotToday = true;
      console.log('📅 TODAY slot found');
    }
    // Завтра
    if (slotTimeMs >= tomorrowStartMs && slotTimeMs <= tomorrowEndMs) {
      hasSlotTomorrow = true;
      console.log('📅 TOMORROW slot found');
    }
    // Послезавтра
    if (slotTimeMs >= in2DaysStartMs && slotTimeMs <= in2DaysEndMs) {
      hasSlotIn2Days = true;
      console.log('📅 IN_2_DAYS slot found');
    }
    // 3-4 дня
    if (slotTimeMs >= in3DaysStartMs && slotTimeMs <= in4DaysEndMs) {
      hasSlotIn3_4Days = true;
      console.log('📅 IN_3_4_DAYS slot found');
    }
  }
  
  if (hasSlotToday) return 'TODAY';
  if (hasSlotTomorrow) return 'TOMORROW';
  if (hasSlotIn2Days) return 'IN_2_DAYS';
  if (hasSlotIn3_4Days) return 'IN_3_4_DAYS';
  return 'FULLY_BOOKED';
}

// ГЛАВНАЯ ФУНКЦИЯ - вызывается напрямую, без HTTP
export async function runParseYclients(staffIds?: number[], syncAll?: boolean): Promise<{
  success: boolean;
  data: ParsedResult[];
  timestamp: string;
  summary: { total: number; success: number; failed: number };
}> {
  console.log(' Parse request:', { staffIds, syncAll });
  
  let idsToSync: number[] = staffIds || [];
  
  if (syncAll) {
    try {
      const barbers = await getData<Barber[]>('barbers_data');
      const safeBarbers = Array.isArray(barbers) ? barbers : [];
      idsToSync = safeBarbers
        .filter((b) => b.is_active && b.yclients_staff_id)
        .map((b) => b.yclients_staff_id);
      console.log(`🔄 Syncing ${idsToSync.length} active masters from KV:`, idsToSync);
    } catch (err) {
      console.error(' Error loading barbers for sync:', err);
    }
  }
  
  if (!Array.isArray(idsToSync) || idsToSync.length === 0) {
    console.warn('⚠️ No staff IDs to sync');
    return {
      success: false,
      data: [],
      timestamp: new Date().toISOString(),
      summary: { total: 0, success: 0, failed: 0 },
    };
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
    return {
      success: false,
      data: results,
      timestamp: new Date().toISOString(),
      summary: { total: results.length, success: 0, failed: results.length },
    };
  }
  
  console.log('✅ Using token for API requests');
  
  const results: ParsedResult[] = await Promise.all(
    idsToSync.map(async (staffId) => {
      console.log(`\n👤 Processing staff ${staffId}...`);
      
      try {
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
      } catch (error) {
        console.error(`❌ Error processing staff ${staffId}:`, error);
        return {
          staff_id: staffId,
          status: null,
          slots_count: 0,
          next_available: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'unknown' as const,
        };
      }
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
    await setData('parsed_statuses_cache', cacheData);
    console.log('💾 Cached statuses saved to KV');
  } catch (err) {
    console.error('❌ Error saving cache to KV:', err);
  }
  
  console.log('\n✅ Sync completed!');
  
  return {
    success: true,
    data: results,
    timestamp: cacheData.timestamp,
    summary: {
      total: results.length,
      success: results.filter(r => r.status).length,
      failed: results.filter(r => r.error).length,
    },
  };
}