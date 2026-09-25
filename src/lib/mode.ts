import { clientEnv } from "@/lib/env";

/** Central mock/live switch. Defaults to mock (no network, no keys). */
export function isMockMode(): boolean {
  return clientEnv.NEXT_PUBLIC_USE_MOCK;
}

export function requireLiveKey(name: string, value: string): void {
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local or use mock mode.`);
  }
}
