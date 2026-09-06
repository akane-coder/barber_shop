// Простой хелпер для Cloudflare KV
export async function getData<T>(key: string): Promise<T | null> {
  try {
    // @ts-ignore - BARBERSHOP_KV будет доступен на Cloudflare
    const kv = (globalThis as any).BARBERSHOP_KV;
    if (kv) {
      const data = await kv.get(key, 'json');
      return data as T;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setData<T>(key: string, data: T): Promise<void> {
  try {
    // @ts-ignore
    const kv = (globalThis as any).BARBERSHOP_KV;
    if (kv) {
      await kv.put(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error('KV write error:', e);
  }
}
