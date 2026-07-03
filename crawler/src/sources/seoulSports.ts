import { config } from "../config.js";
import type { Listing } from "../types.js";
import { fetchWithRetry, sleep } from "../utils/http.js";

/**
 * 서울 열린데이터광장 "서울시 체육시설 공공서비스예약 정보" API.
 * https://data.seoul.go.kr/dataList/OA-2266/S/1/datasetView.do 에서 인증키 발급 후
 * SEOUL_OPENAPI_KEY에 설정. 공식 오픈API. 서울대(관악구) 학부생 대상 서비스라
 * 관악구(기본값, SEOUL_SPORTS_DISTRICTS로 조정 가능) 생활체육 프로그램만 필터링한다.
 *
 * 참고: SEOUL_OPENAPI_KEY 없이도 "sample" 키로 실제 데이터 스키마를 확인할 수 있으나,
 * 샘플 키는 한 번에 최대 5건 + 임의의 데이터만 내려주므로 지역 필터링 검증에는 부족하다.
 */

const SERVICE = "ListPublicReservationSport";

interface SeoulSportsRow {
  SVCID?: string;
  MINCLASSNM?: string;
  SVCSTATNM?: string;
  SVCNM?: string;
  PLACENM?: string;
  SVCURL?: string;
  RCPTBGNDT?: string;
  RCPTENDDT?: string;
  AREANM?: string;
  IMGURL?: string;
}

function parseSeoulDate(raw: string | undefined): string | null {
  if (!raw) return null;
  // "2026-12-31 17:00:00.0" -> ISO, KST 기준
  const normalized = raw.replace(" ", "T").replace(/\.\d+$/, "");
  const date = new Date(`${normalized}+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function crawlSeoulSports(): Promise<Listing[]> {
  if (!config.seoulOpenApiKey) {
    console.warn("[seoul_sports] SEOUL_OPENAPI_KEY 미설정 — 운동 카테고리 크롤링을 건너뜁니다.");
    return [];
  }

  const listings: Listing[] = [];
  const pageSize = 1000;
  let start = 1;
  let totalCount = Infinity;

  while (start <= totalCount) {
    const end = start + pageSize - 1;
    const url = `http://openapi.seoul.go.kr:8088/${config.seoulOpenApiKey}/json/${SERVICE}/${start}/${end}/`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      console.warn(`[seoul_sports] 요청 실패 HTTP ${res.status} — 중단`);
      break;
    }
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      console.warn("[seoul_sports] JSON 파싱 실패 (API 키 오류 가능성):", text.slice(0, 300));
      break;
    }

    const body = json[SERVICE];
    if (!body || body.RESULT?.CODE?.startsWith("ERROR")) {
      console.warn("[seoul_sports] API 오류:", body?.RESULT?.MESSAGE ?? text.slice(0, 300));
      break;
    }

    totalCount = Number(body.list_total_count ?? 0);
    const rows: SeoulSportsRow[] = body.row ?? [];
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!row.AREANM || !config.seoulSportsDistricts.includes(row.AREANM)) continue;
      if (!row.SVCID || !row.SVCNM) continue;
      listings.push({
        source: "seoul_sports",
        sourceId: row.SVCID,
        category: "운동",
        title: row.SVCNM,
        organization: row.PLACENM ?? row.AREANM,
        url:
          row.SVCURL ??
          `https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=${row.SVCID}`,
        deadline: parseSeoulDate(row.RCPTENDDT),
        thumbnailUrl: row.IMGURL ?? null,
        viewCount: null,
        crawledAt: new Date().toISOString(),
      });
    }

    start += pageSize;
    await sleep(config.requestDelayMs);
  }

  return listings;
}
