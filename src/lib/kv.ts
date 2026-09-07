// Универсальный хелпер для работы с данными
// Локально работает с файлами, на Cloudflare - с KV хранилищем

import fs from 'fs/promises';
import path from 'path';

export async function getData<T>(key: string): Promise<T | null> {
  try {
    // Пытаемся получить данные из Cloudflare KV
    // @ts-ignore - BARBERSHOP_KV доступен только на Cloudflare
    const kv = (globalThis as any).BARBERSHOP_KV || process.env.BARBERSHOP_KV;
    
    if (kv && typeof kv.get === 'function') {
      const data = await kv.get(key, 'json');
      if (data) return data as T;
    }
    
    // Fallback на файловую систему (для локальной разработки)
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    const fileData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileData) as T;
  } catch (error) {
    console.warn('getData error:', error);
    return null;
  }
}

export async function setData<T>(key: string, data: T): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);
  
  try {
    // Пытаемся сохранить в Cloudflare KV
    // @ts-ignore - BARBERSHOP_KV доступен только на Cloudflare
    const kv = (globalThis as any).BARBERSHOP_KV || process.env.BARBERSHOP_KV;
    
    if (kv && typeof kv.put === 'function') {
      await kv.put(key, jsonString);
      return;
    }
    
    // Fallback на файловую систему (локально)
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, jsonString, 'utf-8');
  } catch (error) {
    console.error('setData error:', error);
    throw error;
  }
}