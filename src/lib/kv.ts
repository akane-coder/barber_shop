import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getData<T>(key: string): Promise<T | null> {
  try {
    const { env } = getCloudflareContext();
    // @ts-ignore - BARBERSHOP_KV доступен через binding
    const kv = env.BARBERSHOP_KV;
    
    if (kv && typeof kv.get === 'function') {
      const data = await kv.get(key, 'json');
      if (data) return data as T;
    }
    return null;
  } catch (error) {
    console.error("❌ KV read error:", error);
    return null;
  }
}

export async function setData<T>(key: string, data: T): Promise<void> {
  try {
    const { env } = getCloudflareContext();
    // @ts-ignore - BARBERSHOP_KV доступен через binding
    const kv = env.BARBERSHOP_KV;
    
    if (kv && typeof kv.put === 'function') {
      await kv.put(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error("❌ KV write error:", error);
  }
}