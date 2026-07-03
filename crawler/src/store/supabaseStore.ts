import type { Listing } from "../types.js";
import { config } from "../config.js";
import type { ListingStore } from "./index.js";

/**
 * 팀원이 Supabase 프로젝트를 넘겨주면 STORAGE_BACKEND=supabase 로 전환해 바로 쓸 수 있는 어댑터.
 * 필요한 테이블:
 *
 * create table crawled_listings (
 *   source text not null,
 *   source_id text not null,
 *   category text not null,
 *   title text not null,
 *   organization text not null,
 *   url text not null,
 *   deadline timestamptz,
 *   thumbnail_url text,
 *   view_count integer,
 *   crawled_at timestamptz not null,
 *   primary key (source, source_id)
 * );
 */
export class SupabaseStore implements ListingStore {
  private clientPromise: Promise<import("@supabase/supabase-js").SupabaseClient>;

  constructor() {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다 (.env 확인)",
      );
    }
    this.clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(config.supabaseUrl, config.supabaseServiceRoleKey),
    );
  }

  async upsertMany(listings: Listing[]): Promise<void> {
    if (listings.length === 0) return;
    const client = await this.clientPromise;
    const rows = listings.map((l) => ({
      source: l.source,
      source_id: l.sourceId,
      category: l.category,
      title: l.title,
      organization: l.organization,
      url: l.url,
      deadline: l.deadline,
      thumbnail_url: l.thumbnailUrl,
      view_count: l.viewCount,
      crawled_at: l.crawledAt,
    }));
    const { error } = await client
      .from("crawled_listings")
      .upsert(rows, { onConflict: "source,source_id" });
    if (error) throw new Error(`Supabase upsert 실패: ${error.message}`);
  }

  async getAll(): Promise<Listing[]> {
    const client = await this.clientPromise;
    const { data, error } = await client.from("crawled_listings").select("*");
    if (error) throw new Error(`Supabase select 실패: ${error.message}`);
    return (data ?? []).map((row) => ({
      source: row.source,
      sourceId: row.source_id,
      category: row.category,
      title: row.title,
      organization: row.organization,
      url: row.url,
      deadline: row.deadline,
      thumbnailUrl: row.thumbnail_url,
      viewCount: row.view_count,
      crawledAt: row.crawled_at,
    }));
  }
}
