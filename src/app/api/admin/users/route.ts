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

interface SafeUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  barberId?: string | null;
  createdAt: string;
}

function getSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session');
  if (!cookie) return null;
  try {
    const session = JSON.parse(cookie.value);
    if (session.role !== 'admin') return null;
    return session;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const users = (await getData<User[]>('users')) || [];
  const safeUsers: SafeUser[] = users.map(({ passwordHash, ...rest }: User) => rest);
  return NextResponse.json(safeUsers);
}

export async function POST(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { username, password, role, barberId } = await req.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
    }
    
    const users = (await getData<User[]>('users')) || [];
    if (users.some((u: User) => u.username === username)) {
      return NextResponse.json({ error: 'Пользователь с таким логином уже существует' }, { status: 400 });
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      passwordHash: await hashPassword(password),
      role,
      barberId: role === 'user' ? barberId || null : null,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    await setData('users', users);
    
    const { passwordHash, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
    
    let users = (await getData<User[]>('users')) || [];
    users = users.filter((u: User) => u.id !== userId);
    
    await setData('users', users);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}