import { NextRequest, NextResponse } from 'next/server';
import { Barber } from '@/types';
import { getData, setData } from '@/lib/kv';

function getSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session');
  if (!cookie) return null;
  try { return JSON.parse(cookie.value); } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const barbers = await getData<Barber[]>('barbers_data');
    const safeBarbers = Array.isArray(barbers) ? barbers : [];
    return NextResponse.json(safeBarbers);
  } catch (error) {
    console.error('❌ Ошибка чтения мастеров:', error);
    return NextResponse.json({ error: 'Ошибка чтения данных' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const barber: Barber = await req.json();
    
    let currentBarbers = await getData<Barber[]>('barbers_data');
    if (!Array.isArray(currentBarbers)) {
      console.warn('⚠️ barbers_data не массив, создаём новый');
      currentBarbers = [];
    }
    
    const index = currentBarbers.findIndex(b => b.id === barber.id);
    if (index !== -1) {
      currentBarbers[index] = barber;
    } else {
      currentBarbers.push(barber);
    }
    
    await setData('barbers_data', currentBarbers); // ✅ ПРАВИЛЬНО!
    return NextResponse.json({ success: true, data: currentBarbers });
  } catch (error) {
    console.error(' Ошибка сохранения:', error);
    return NextResponse.json({ error: 'Ошибка сохранения данных' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await req.json();
    let currentBarbers = await getData<Barber[]>('barbers_data');
    
    if (!Array.isArray(currentBarbers)) {
      currentBarbers = [];
    }
    
    const filtered = currentBarbers.filter(b => b.id !== id);
    await setData('barbers_data', filtered); // ✅ ПРАВИЛЬНО!
    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error('❌ Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}