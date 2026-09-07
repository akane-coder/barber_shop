import { KVNamespace } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  BARBERSHOP_KV: KVNamespace;
  ASSETS: Fetcher;
}

declare module "@opennextjs/cloudflare" {
  export function getCloudflareContext(): {
    env: CloudflareEnv;
    ctx: any;
  };
}