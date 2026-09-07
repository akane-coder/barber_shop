import fs from 'fs/promises';
import path from 'path';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getData<T>(key: string): Promise<T | null> {
  // 1. Пробуем Cloudflare KV (на продакшене)
  try {
    const { env } = getCloudflareContext();
    const kv = env.BARBERSHOP_KV;
    
    if (kv && typeof kv.get === 'function') {
      const data = await kv.get(key, 'json');
      if (data) return data as T;
    }
  } catch (e) {
    console.warn('KV read error, falling back to fs:', e);
  }

  // 2. Fallback на файловую систему (только для локальной разработки npm run dev)
  try {
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setData<T>(key: string, data: T): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);
  
  // 1. Пробуем Cloudflare KV
  try {
    const { env } = getCloudflareContext();
    const kv = env.BARBERSHOP_KV;
    
    if (kv && typeof kv.put === 'function') {
      await kv.put(key, jsonString);
      return;
    }
  } catch (e) {
    console.warn('KV write error, falling back to fs:', e);
  }

  // 2. Fallback на файловую систему
  try {
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, jsonString, 'utf-8');
  } catch (e) {
    console.error('FS write error:', e);
  }
}