// src/types/cloudflare-env.d.ts
export interface CloudflareEnv {
  BARBERSHOP_KV: KVNamespace;
  ASSETS: Fetcher;
}

declare global {
  var BARBERSHOP_KV: KVNamespace;
}

export {};