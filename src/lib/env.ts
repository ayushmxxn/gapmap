import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_USE_MOCK: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional().default(""),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
});

const serverSchema = clientSchema.extend({
  SERPAPI_KEY: z.string().optional().default(""),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function readClientEnv(): ClientEnv {
  return clientSchema.parse({
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

function readServerEnv(): ServerEnv {
  return serverSchema.parse({
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERPAPI_KEY:
      process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY || "",
  });
}

export const clientEnv = readClientEnv();
export const serverEnv =
  typeof window === "undefined" ? readServerEnv() : (clientEnv as ServerEnv);
