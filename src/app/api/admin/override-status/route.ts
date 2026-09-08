import { NextRequest, NextResponse } from 'next/server';
import { Barber, MasterLoadStatus } from '@/types';
import { getData, setData } from '@/lib/kv';

function getSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!getSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { barberId, status } = await req.json();
    if (!barberId) {
      return NextResponse.json({ error: 'barberId is required' }, { status: 400 });
    }

    let barbers = await getData<Barber[]>('barbers_data');
    if (!Array.isArray(barbers)) {
      barbers = [];
    }

    const updatedBarbers = barbers.map(b => {
      if (b.id === barberId) {
        return { 
          ...b, 
          manual_status: status ? status as MasterLoadStatus : null 
        };
      }
      return b;
    });

    await setData('barbers_data', updatedBarbers);
    return NextResponse.json({ success: true, data: updatedBarbers });
  } catch (error) {
    console.error('Override error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}