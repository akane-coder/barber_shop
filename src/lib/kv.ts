import fs from 'fs/promises';
import path from 'path';

// Пытаемся импортировать Cloudflare контекст (доступен только на Cloudflare)
let getRequestContext: any = null;
try {
  getRequestContext = require('@cloudflare/next-on-pages').getRequestContext;
} catch (e) {
  // Игнорируем, если пакет не доступен (например, в некоторых тестах)
}

export async function getData<T>(key: string, filePath: string): Promise<T | null> {
  // 1. Пытаемся получить данные из Cloudflare KV
  if (getRequestContext) {
    try {
      const { env } = getRequestContext();
      if (env.BARBERSHOP_KV) {
        const data = await env.BARBERSHOP_KV.get(key, 'json');
        if (data) return data as T;
      }
    } catch (e) {
      // getRequestContext() упадет в локальном dev, игнорируем и идем в fallback
    }
  }

  // 2. Fallback на файловую систему (для локальной разработки)
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', filePath), 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setData<T>(key: string, filePath: string, data: T): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);

  // 1. Пытаемся сохранить в Cloudflare KV
  if (getRequestContext) {
    try {
      const { env } = getRequestContext();
      if (env.BARBERSHOP_KV) {
        await env.BARBERSHOP_KV.put(key, jsonString);
        return; // Успешно сохранили в облако, выходим
      }
    } catch (e) {
      // Fallback на fs
    }
  }

  // 2. Fallback на файловую систему (локально)
  const fullPath = path.join(process.cwd(), 'data', filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, jsonString, 'utf-8');
}