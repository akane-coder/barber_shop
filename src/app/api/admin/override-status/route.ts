import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Barber, MasterLoadStatus } from '@/types';

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

    let barbers: Barber[] = [];
    const localPath = path.join(process.cwd(), 'data', 'barbers.json');
    try {
      const data = await fs.readFile(localPath, 'utf-8');
      barbers = JSON.parse(data);
    } catch {
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

    await fs.writeFile(localPath, JSON.stringify(updatedBarbers, null, 2));
    return NextResponse.json({ success: true, data: updatedBarbers });
  } catch (error) {
    console.error('Override error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}