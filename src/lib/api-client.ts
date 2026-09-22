// Bare HTTP transport for the backend's response envelope. Knows nothing
// about any feature — every feature's service reuses this.

import { env } from "@/config/env";

interface Envelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export async function apiGet<T>(path: string, params: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(path, env.apiBaseUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);

  const json = (await res.json()) as Envelope<T>;
  if (!json.status) throw new Error(json.message || `${path}: request failed`);
  return json.data;
}
