import { NextRequest, NextResponse } from 'next/server';
import { GITHUB_CONFIG } from '@/types';

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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: 'Нет файла или пути' }, { status: 400 });
    }

    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `public/images/${path}/${uniqueName}`;
    const cdnUrl = `${GITHUB_CONFIG.cdnBase}/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}@${GITHUB_CONFIG.branch}/${filePath}`;

    return NextResponse.json({ 
      url: cdnUrl, 
      filename: uniqueName,
      path: filePath,
      message: 'Для загрузки на GitHub используйте скрипт upload.js или GitHub UI'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 });
  }
}