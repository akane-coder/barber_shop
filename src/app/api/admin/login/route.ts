import { NextRequest, NextResponse } from 'next/server';
import { getData } from '@/lib/kv';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  barberId?: string | null;
  createdAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const passwordHash = await hashPassword(password);
    
    const users = (await getData<User[]>('users', 'users.json')) || [];
    const user = users.find(u => u.username === username && u.passwordHash === passwordHash);
    
    if (!user) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    const sessionData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      barberId: user.barberId || null,
    };

    const response = NextResponse.json({
      success: true,
      user: { username: user.username, role: user.role, barberId: user.barberId }
    });
    
    response.cookies.set('admin_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}