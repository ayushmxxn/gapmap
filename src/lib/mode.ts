import { clientEnv } from "@/lib/env";

// Defaults to mock mode so searches work out of the box without API keys.
export function isMockMode(): boolean {
  return clientEnv.NEXT_PUBLIC_USE_MOCK;
}
