import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getData<T>(key: string): Promise<T | null> {
  try {
    const { env } = getCloudflareContext();
    // @ts-ignore - BARBERSHOP_KV доступен через binding
    const kv = env.BARBERSHOP_KV;
    
    if (!kv) {
      console.error('❌ KV binding не найден');
      return null;
    }
    
    const data = await kv.get(key, 'json');
    if (data) return data as T;
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
    
    if (!kv) {
      console.error('❌ KV binding не найден');
      throw new Error('KV binding не доступен');
    }
    
    const jsonString = JSON.stringify(data);
    console.log(' Сохраняем в KV:', key, 'размер:', jsonString.length, 'байт');
    
    await kv.put(key, jsonString);
    console.log('✅ Успешно сохранено в KV');
  } catch (error) {
    console.error("❌ KV write error:", error);
    throw error; // Пробрасываем ошибку дальше
  }
}