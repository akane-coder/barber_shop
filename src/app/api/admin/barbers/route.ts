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
    const barbers = (await getData<Barber[]>('barbers_data')) || [];
    return NextResponse.json(barbers);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка чтения данных' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const barber: Barber = await req.json();
    const currentBarbers = (await getData<Barber[]>('barbers_data')) || [];
    
    const index = currentBarbers.findIndex(b => b.id === barber.id);
    if (index !== -1) currentBarbers[index] = barber;
    else currentBarbers.push(barber);
    
    await setData('barbers_data', 'barbers.json');
    return NextResponse.json({ success: true, data: currentBarbers });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сохранения данных' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await req.json();
    const currentBarbers = (await getData<Barber[]>('barbers_data')) || [];
    const filtered = currentBarbers.filter(b => b.id !== id);
    
    await setData('barbers_data', 'barbers.json');
    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}