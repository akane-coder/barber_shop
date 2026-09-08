import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getData<T>(key: string): Promise<T | null> {
  try {
    // ✅ ИСПОЛЬЗУЕМ ASYNC MODE, как рекомендует OpenNext
    const { env } = await getCloudflareContext({ async: true });
    // @ts-ignore - BARBERSHOP_KV доступен через binding
    const kv = env.BARBERSHOP_KV;
    
    if (!kv) {
      console.warn('⚠️ KV binding не найден. Проверьте wrangler.toml');
      return null;
    }
    
    const data = await kv.get(key, 'json');
    return data as T;
  } catch (error) {
    console.error("❌ KV read error:", error);
    return null;
  }
}

export async function setData<T>(key: string, data: T): Promise<void> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    // @ts-ignore - BARBERSHOP_KV доступен через binding
    const kv = env.BARBERSHOP_KV;
    
    if (!kv) {
      console.error('❌ KV binding не найден');
      throw new Error('KV binding не доступен');
    }
    
    await kv.put(key, JSON.stringify(data));
  } catch (error) {
    console.error("❌ KV write error:", error);
    throw error;
  }
}