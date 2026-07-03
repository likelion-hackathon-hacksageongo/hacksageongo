import { config } from "../config.js";
import type { Listing } from "../types.js";
import { fetchWithRetry, sleep } from "../utils/http.js";

/**
 * 큐넷(Q-net, 한국산업인력공단) 국가자격시험 시행일정 오픈API.
 * https://www.data.go.kr/data/15074408/openapi.do 에서 활용신청 후 QNET_SERVICE_KEY 발급.
 * 공식 오픈API라 리스크 없음. 응시자격/자기계발 목표(자격증 취득)에 붙이기 위해 추가.
 *
 * jmCd(종목코드)를 지정하지 않으면 자격구분(qualgbCd)별 연간 회차 일정을 돌려준다 — 개별
 * 종목명이 아니라 "국가기술자격 1회 필기시험" 같은 회차 단위 일정이므로, description 필드에
 * 담긴 설명을 title에 함께 붙여 어떤 시험군인지 알아볼 수 있게 한다.
 */

const ENDPOINT = "https://apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList";

const QUALGB_NAME: Record<string, string> = {
  T: "국가기술자격",
  C: "과정평가형자격",
  W: "일학습병행자격",
  S: "국가전문자격",
};

interface QnetSchedule {
  implYy?: string;
  implSeq?: string;
  qualgbCd?: string;
  qualgbNm?: string;
  description?: string;
  docRegStartDt?: string;
  docRegEndDt?: string;
  docExamStartDt?: string;
  docExamEndDt?: string;
  docPassDt?: string;
  pracRegStartDt?: string;
  pracRegEndDt?: string;
  pracExamStartDt?: string;
  pracExamEndDt?: string;
  pracPassDt?: string;
}

interface QnetResponse {
  resultCode?: string;
  resultMsg?: string;
  totalCount?: number;
  items?: QnetSchedule[];
}

function normalizeResponse(body: unknown): QnetResponse {
  // 실제 응답 스키마는 apis.data.go.kr 공통 포맷(response.body.items.item[])을 따르는 경우가
  // 많아, 몇 가지 흔한 형태를 관대하게 처리한다. serviceKey 발급 후 실제 응답을 보고 필요하면
  // 이 함수만 조정하면 된다.
  const anyBody = body as any;
  const wrapped = anyBody?.response?.body ?? anyBody?.getQualExamSchdList ?? anyBody;
  const items = wrapped?.items?.item ?? wrapped?.items ?? wrapped?.item ?? [];
  return {
    resultCode: wrapped?.resultCode,
    resultMsg: wrapped?.resultMsg,
    totalCount: Number(wrapped?.totalCount ?? 0),
    items: Array.isArray(items) ? items : [items].filter(Boolean),
  };
}

function parseYyyymmdd(raw: string | undefined): string | null {
  if (!raw || raw.length !== 8) return null;
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  const date = new Date(`${y}-${m}-${d}T23:59:59+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export interface QnetCrawlOptions {
  implYy?: string; // 기본: 올해
  qualgbCd?: "T" | "C" | "W" | "S";
}

export async function crawlQnet(options: QnetCrawlOptions = {}): Promise<Listing[]> {
  if (!config.qnetServiceKey) {
    console.warn("[qnet] QNET_SERVICE_KEY 미설정 — 자격시험 카테고리 크롤링을 건너뜁니다.");
    return [];
  }

  const implYy = options.implYy ?? String(new Date().getFullYear());
  const listings: Listing[] = [];
  const numOfRows = 100;
  let pageNo = 1;
  let totalCount = Infinity;

  while ((pageNo - 1) * numOfRows < totalCount) {
    const params = new URLSearchParams({
      serviceKey: config.qnetServiceKey,
      numOfRows: String(numOfRows),
      pageNo: String(pageNo),
      dataFormat: "json",
      implYy,
    });
    if (options.qualgbCd) params.set("qualgbCd", options.qualgbCd);

    const res = await fetchWithRetry(`${ENDPOINT}?${params.toString()}`);
    if (!res.ok) {
      console.warn(`[qnet] 요청 실패 HTTP ${res.status} — 중단`);
      break;
    }
    const text = await res.text();
    let parsed: QnetResponse;
    try {
      parsed = normalizeResponse(JSON.parse(text));
    } catch {
      console.warn("[qnet] JSON 파싱 실패 (serviceKey 오류이거나 응답 포맷이 다를 수 있음):", text.slice(0, 200));
      break;
    }

    totalCount = parsed.totalCount ?? 0;
    const items = parsed.items ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      const qualgbNm = item.qualgbNm ?? QUALGB_NAME[item.qualgbCd ?? ""] ?? "국가자격";
      const round = item.implSeq ? `${item.implSeq}회` : "";
      const title = [qualgbNm, round, "필기시험", item.description]
        .filter(Boolean)
        .join(" ")
        .trim();
      const sourceId = `${implYy}-${item.qualgbCd ?? ""}-${item.implSeq ?? ""}`;
      const deadline =
        parseYyyymmdd(item.docRegEndDt) ?? parseYyyymmdd(item.pracRegEndDt) ?? null;

      listings.push({
        source: "qnet",
        sourceId,
        category: "자격시험",
        title,
        organization: "한국산업인력공단",
        url: "https://www.q-net.or.kr/crf021.do?id=crf02101",
        deadline,
        thumbnailUrl: null,
        viewCount: null,
        crawledAt: new Date().toISOString(),
      });
    }

    pageNo += 1;
    await sleep(config.requestDelayMs);
  }

  return listings;
}
