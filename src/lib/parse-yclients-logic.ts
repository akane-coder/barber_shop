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

// Вспомогательная функция для получения даты в формате YYYY-MM-DD в часовом поясе Минска
function getMinskDate(offsetDays: number = 0): string {
const now = new Date();
// Получаем UTC время
const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
// Добавляем смещение Минска (UTC+3)
const minskTime = new Date(utcTime + 3 * 60 * 60 * 1000);
// Добавляем дни
minskTime.setDate(minskTime.getDate() + offsetDays);
// Форматируем в YYYY-MM-DD
const year = minskTime.getFullYear();
const month = String(minskTime.getMonth() + 1).padStart(2, '0');
const day = String(minskTime.getDate()).padStart(2, '0');
return `${year}-${month}-${day}`;
}

async function fetchMasterSlotsMultiDay(staffId: number, daysCount: number = 4): Promise<{ slots: TimeSlot[]; firstAvailableDate: string | null }> {
const allSlots: TimeSlot[] = [];
let firstAvailableDate: string | null = null;

console.log(`\
📅 Начинаем запрос слотов для staff ${staffId}`);
console.log(`🕐 Текущее время UTC: ${new Date().toISOString()}`);
console.log(`🕐 Текущее время Минска: ${getMinskDate(0)} (сегодня)`);

for (let i = 0; i < daysCount; i++) {
const dateStr = getMinskDate(i);
console.log(`📅 Запрашиваем слоты на ${dateStr} (день +${i})`);

const daySlots = await fetchSlotsForDate(staffId, dateStr);
const bookableSlots = daySlots.filter(s => s.is_bookable);

console.log(`  → Найдено ${daySlots.length} слотов, ${bookableSlots.length} доступны`);

if (bookableSlots.length > 0 && !firstAvailableDate) {
firstAvailableDate = dateStr;
console.log(`  ✅ Первое доступное время: ${dateStr}`);
}

allSlots.push(...daySlots);
}

return { slots: allSlots, firstAvailableDate };
}

function calculateMasterStatus(slots: TimeSlot[]): string {
// ✅ ПРАВИЛЬНОЕ ПОЛУЧЕНИЕ ВРЕМЕНИ МИНСКА
const now = new Date();
const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
const minskTime = new Date(utcTime + 3 * 60 * 60 * 1000);

console.log('\
=== calculateMasterStatus ===');
console.log(`🕐 Время Минска: ${minskTime.toISOString()}`);
console.log(`📅 Сегодня: ${getMinskDate(0)}`);
console.log(`📅 Завтра: ${getMinskDate(1)}`);
console.log(`📅 Послезавтра: ${getMinskDate(2)}`);

const nowPlus2Hours = new Date(minskTime.getTime() + 2 * 60 * 60 * 1000);

// Границы дней в Минске
const todayStart = new Date(minskTime);
todayStart.setHours(0, 0, 0, 0);
const todayEnd = new Date(minskTime);
todayEnd.setHours(23, 59, 59, 999);

const tomorrowStart = new Date(todayEnd);
tomorrowStart.setDate(tomorrowStart.getDate() + 1);
tomorrowStart.setHours(0, 0, 0, 0);
const tomorrowEnd = new Date(tomorrowStart);
tomorrowEnd.setHours(23, 59, 59, 999);

const in2DaysStart = new Date(tomorrowEnd);
in2DaysStart.setDate(in2DaysStart.getDate() + 1);
in2DaysStart.setHours(0, 0, 0, 0);
const in2DaysEnd = new Date(in2DaysStart);
in2DaysEnd.setHours(23, 59, 59, 999);

const in3DaysStart = new Date(in2DaysEnd);
in3DaysStart.setDate(in3DaysStart.getDate() + 1);
in3DaysStart.setHours(0, 0, 0, 0);
const in4DaysEnd = new Date(in3DaysStart);
in4DaysEnd.setDate(in4DaysEnd.getDate() + 1);
in4DaysEnd.setHours(23, 59, 59, 999);

let hasSlotToday = false;
let hasSlotTomorrow = false;
let hasSlotIn2Days = false;
let hasSlotIn3_4Days = false;

console.log(`\
📊 Всего слотов для анализа: ${slots.length}`);

for (const slot of slots) {
if (!slot.is_bookable) continue;

const slotTime = new Date(slot.datetime);
console.log(`  🔍 Слот: ${slot.datetime} | Bookable: ${slot.is_bookable}`);

// IMMEDIATE - в ближайшие 2 часа
if (slotTime >= minskTime && slotTime <= nowPlus2Hours) {
console.log(`    ✅ IMMEDIATE (в ближайшие 2 часа)`);
return 'IMMEDIATE';
}

// Сегодня
if (slotTime >= todayStart && slotTime <= todayEnd) {
hasSlotToday = true;
console.log(`    📌 TODAY`);
}
// Завтра
else if (slotTime >= tomorrowStart && slotTime <= tomorrowEnd) {
hasSlotTomorrow = true;
console.log(`    📌 TOMORROW`);
}
// Послезавтра
else if (slotTime >= in2DaysStart && slotTime <= in2DaysEnd) {
hasSlotIn2Days = true;
console.log(`     IN_2_DAYS`);
}
// 3-4 дня
else if (slotTime >= in3DaysStart && slotTime <= in4DaysEnd) {
hasSlotIn3_4Days = true;
console.log(`    📌 IN_3_4_DAYS`);
}
else {
console.log(`    ⚪ Вне диапазона (дальше 4 дней)`);
}
}

console.log(`\
📊 Результаты: today=${hasSlotToday}, tomorrow=${hasSlotTomorrow}, in2Days=${hasSlotIn2Days}, in3_4Days=${hasSlotIn3_4Days}`);

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