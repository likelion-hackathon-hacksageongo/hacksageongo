import "dotenv/config";

export const config = {
  storageBackend: (process.env.STORAGE_BACKEND ?? "json") as "json" | "supabase",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  worknetAuthKey: process.env.WORKNET_AUTH_KEY ?? "",
  linkareerMaxPages: process.env.LINKAREER_MAX_PAGES
    ? Number(process.env.LINKAREER_MAX_PAGES)
    : null,
  requestDelayMs: Number(process.env.REQUEST_DELAY_MS ?? 1200),
  port: Number(process.env.PORT ?? 4000),
};
