import express from "express";
import { config } from "./config.js";
import { getStore } from "./store/index.js";
import type { ListingCategory } from "./types.js";

const app = express();

/**
 * 백엔드가 어떤 언어/스택이든 이 HTTP API로 크롤링 데이터를 가져갈 수 있다.
 * GET /api/listings?category=인턴&keyword=백엔드
 */
app.get("/api/listings", async (req, res) => {
  const store = await getStore();
  let listings = await store.getAll();

  const category = req.query.category as ListingCategory | undefined;
  if (category) {
    listings = listings.filter((l) => l.category === category);
  }

  const keyword = (req.query.keyword as string | undefined)?.trim();
  if (keyword) {
    const lower = keyword.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.title.toLowerCase().includes(lower) || l.organization.toLowerCase().includes(lower),
    );
  }

  res.json({ count: listings.length, listings });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`crawler API listening on http://localhost:${config.port}`);
});
