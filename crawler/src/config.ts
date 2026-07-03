import "dotenv/config";

export const config = {
  storageBackend: (process.env.STORAGE_BACKEND ?? "json") as "json" | "supabase",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  seoulOpenApiKey: process.env.SEOUL_OPENAPI_KEY ?? "",
  seoulSportsDistricts: (process.env.SEOUL_SPORTS_DISTRICTS ?? "관악구")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  linkareerMaxPages: process.env.LINKAREER_MAX_PAGES
    ? Number(process.env.LINKAREER_MAX_PAGES)
    : null,
  requestDelayMs: Number(process.env.REQUEST_DELAY_MS ?? 1200),
  port: Number(process.env.PORT ?? 4000),
};
