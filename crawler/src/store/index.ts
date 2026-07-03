import { config } from "../config.js";
import type { Listing } from "../types.js";

export interface ListingStore {
  upsertMany(listings: Listing[]): Promise<void>;
  getAll(): Promise<Listing[]>;
}

let cached: ListingStore | null = null;

export async function getStore(): Promise<ListingStore> {
  if (cached) return cached;
  if (config.storageBackend === "supabase") {
    const { SupabaseStore } = await import("./supabaseStore.js");
    cached = new SupabaseStore();
  } else {
    const { JsonFileStore } = await import("./jsonFileStore.js");
    cached = new JsonFileStore();
  }
  return cached;
}
