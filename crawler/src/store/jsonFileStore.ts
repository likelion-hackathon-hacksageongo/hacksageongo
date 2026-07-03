import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Listing } from "../types.js";
import type { ListingStore } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "listings.json");

/** 기본 저장소. source+sourceId 로 upsert 하여 로컬 JSON 파일에 적재한다. 팀원 백엔드가 이 파일을 읽거나, server.ts의 HTTP API로 가져갈 수 있다. */
export class JsonFileStore implements ListingStore {
  async getAll(): Promise<Listing[]> {
    try {
      const raw = await readFile(DATA_FILE, "utf-8");
      return JSON.parse(raw) as Listing[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async upsertMany(listings: Listing[]): Promise<void> {
    const existing = await this.getAll();
    const byKey = new Map(existing.map((l) => [`${l.source}:${l.sourceId}`, l]));
    for (const listing of listings) {
      byKey.set(`${listing.source}:${listing.sourceId}`, listing);
    }
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify([...byKey.values()], null, 2), "utf-8");
  }
}
