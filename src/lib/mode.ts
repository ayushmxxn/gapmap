import { clientEnv } from "@/lib/env";

/** Central mock/live switch. Defaults to mock (no network, no keys). */
export function isMockMode(): boolean {
  return clientEnv.NEXT_PUBLIC_USE_MOCK;
}
