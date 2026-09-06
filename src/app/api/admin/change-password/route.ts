import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/kv';

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

function getSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session');
  if (!cookie) return null;
  try { return JSON.parse(cookie.value); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const sessionData = getSession(req);
    if (!sessionData) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'Пароль должен быть минимум 4 символа' }, { status: 400 });
    }

    const users = (await getData<User[]>('users')) || [];
    const userIndex = users.findIndex(u => u.id === sessionData.userId);
    
    if (userIndex === -1) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    const currentHash = await hashPassword(currentPassword);
    if (users[userIndex].passwordHash !== currentHash) {
      return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
    }

    users[userIndex].passwordHash = await hashPassword(newPassword);
    await setData('users', users);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}