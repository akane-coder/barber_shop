import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('admin_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const sessionData = JSON.parse(sessionCookie.value);
    
    return NextResponse.json({
      userId: sessionData.userId,
      username: sessionData.username,
      role: sessionData.role,
      barberId: sessionData.barberId,
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}