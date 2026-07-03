import { config } from "../config.js";
import type { Listing } from "../types.js";
import { fetchWithRetry, sleep } from "../utils/http.js";

/**
 * 워크넷(work24) 채용정보 오픈 API. 고용노동부/한국고용정보원이 제공하는 공식 오픈 API로,
 * 링커리어 스크래핑보다 법적 리스크가 없다. 사용하려면 https://www.work24.go.kr 에서
 * authKey를 발급받아 WORKNET_AUTH_KEY 환경변수에 넣어야 한다.
 *
 * 주의: 정확한 엔드포인트/파라미터 스펙은 발급받은 계정으로 로그인해야 볼 수 있는
 * Work24 문서에 있다(비로그인 상태에서는 확인 불가). 아래 엔드포인트/파라미터명은
 * 공개된 관련 자료(공공데이터포털, work24 안내 페이지) 기준 best-effort이므로,
 * authKey 발급 후 실제 응답을 보고 WORKNET_LIST_ENDPOINT 파싱 로직을 맞춰 조정할 것.
 */

const DEFAULT_ENDPOINT = "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do";

interface WorknetWantedItem {
  wantedAuthNo?: string;
  company?: string;
  title?: string;
  salTpNm?: string;
  region?: string;
  regDt?: string;
  closeDt?: string;
  wantedInfoUrl?: string;
}

function parseWorknetXml(xml: string): WorknetWantedItem[] {
  const items: WorknetWantedItem[] = [];
  const blocks = xml.match(/<wanted>[\s\S]*?<\/wanted>/g) ?? [];
  for (const block of blocks) {
    const field = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : undefined;
    };
    items.push({
      wantedAuthNo: field("wantedAuthNo"),
      company: field("company"),
      title: field("title"),
      region: field("region"),
      regDt: field("regDt"),
      closeDt: field("closeDt"),
      wantedInfoUrl: field("wantedInfoUrl"),
    });
  }
  return items;
}

export interface WorknetCrawlOptions {
  keyword?: string;
  maxPages?: number;
}

export async function crawlWorknet(options: WorknetCrawlOptions = {}): Promise<Listing[]> {
  if (!config.worknetAuthKey) {
    console.warn("[worknet] WORKNET_AUTH_KEY 미설정 — 채용 카테고리 크롤링을 건너뜁니다.");
    return [];
  }

  const listings: Listing[] = [];
  const display = 100;
  let startPage = 1;
  const maxPages = options.maxPages ?? 5;

  while (startPage <= maxPages) {
    const params = new URLSearchParams({
      authKey: config.worknetAuthKey,
      callTp: "L",
      returnType: "XML",
      startPage: String(startPage),
      display: String(display),
    });
    if (options.keyword) params.set("keyword", options.keyword);

    const url = `${DEFAULT_ENDPOINT}?${params.toString()}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      console.warn(`[worknet] 요청 실패 HTTP ${res.status} — 중단`);
      break;
    }
    const xml = await res.text();
    const items = parseWorknetXml(xml);
    if (items.length === 0) break;

    for (const item of items) {
      if (!item.wantedAuthNo || !item.title) continue;
      listings.push({
        source: "worknet",
        sourceId: item.wantedAuthNo,
        category: "채용",
        title: item.title,
        organization: item.company ?? "",
        url: item.wantedInfoUrl ?? `https://www.work24.go.kr/wk/a/b/1200/retriveDtlEmpSrchList.do?wantedAuthNo=${item.wantedAuthNo}`,
        deadline: parseWorknetDate(item.closeDt),
        thumbnailUrl: null,
        viewCount: null,
        crawledAt: new Date().toISOString(),
      });
    }

    if (items.length < display) break;
    startPage += 1;
    await sleep(config.requestDelayMs);
  }

  return listings;
}

function parseWorknetDate(raw: string | undefined): string | null {
  if (!raw || raw.length !== 8) return null;
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  const date = new Date(`${y}-${m}-${d}T23:59:59+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
