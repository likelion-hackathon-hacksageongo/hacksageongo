import { crawlLinkareer } from "./sources/linkareer.js";
import { crawlWorknet } from "./sources/worknet.js";
import { crawlQnet } from "./sources/qnet.js";
import { crawlSeoulSports } from "./sources/seoulSports.js";
import { getStore } from "./store/index.js";
import type { Listing, ListingCategory } from "./types.js";

const LINKAREER_CATEGORIES: ListingCategory[] = ["대외활동", "공모전", "인턴"];

export async function runCrawl(): Promise<Listing[]> {
  const all: Listing[] = [];

  for (const category of LINKAREER_CATEGORIES) {
    try {
      const listings = await crawlLinkareer(category);
      console.log(`[linkareer] ${category}: ${listings.length}건 수집`);
      all.push(...listings);
    } catch (err) {
      console.error(`[linkareer] ${category} 크롤링 실패:`, err);
    }
  }

  try {
    const worknetListings = await crawlWorknet({ keyword: "" });
    console.log(`[worknet] 채용: ${worknetListings.length}건 수집`);
    all.push(...worknetListings);
  } catch (err) {
    console.error("[worknet] 크롤링 실패:", err);
  }

  try {
    const qnetListings = await crawlQnet();
    console.log(`[qnet] 자격시험: ${qnetListings.length}건 수집`);
    all.push(...qnetListings);
  } catch (err) {
    console.error("[qnet] 크롤링 실패:", err);
  }

  try {
    const seoulSportsListings = await crawlSeoulSports();
    console.log(`[seoul_sports] 운동: ${seoulSportsListings.length}건 수집`);
    all.push(...seoulSportsListings);
  } catch (err) {
    console.error("[seoul_sports] 크롤링 실패:", err);
  }

  const store = await getStore();
  await store.upsertMany(all);
  console.log(`총 ${all.length}건 저장 완료 (backend=${process.env.STORAGE_BACKEND ?? "json"})`);

  return all;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCrawl().catch((err) => {
    console.error("크롤링 실행 실패:", err);
    process.exitCode = 1;
  });
}
