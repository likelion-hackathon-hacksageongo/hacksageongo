import { config } from "../config.js";
import type { Listing, ListingCategory } from "../types.js";
import { fetchWithRetry, sleep } from "../utils/http.js";

/**
 * 링커리어는 Next.js SSR 페이지에 Apollo Client 캐시(__NEXT_DATA__)를 그대로 심어 내려준다.
 * GraphQL 엔드포인트를 직접 재현하는 대신, 이 SSR 페이지를 읽어 임베디드 JSON을 파싱한다.
 * - GraphQL 쿼리/헤더/인증 토큰을 추정할 필요가 없어 더 안정적이다 (UI가 바뀌어도 데이터 계약은 유지됨).
 * - robots.txt(User-agent: *, Allow: /)가 /list/* 경로를 막지 않는다. 막힌 경로는 /stem/learn/* 뿐.
 */

const CATEGORY_PATH: Record<ListingCategory, string | null> = {
  대외활동: "activity",
  공모전: "contest",
  인턴: "intern",
  운동: null, // seoulSports.ts 참고
};

interface ApolloActivity {
  __typename: "Activity";
  id: string;
  title: string;
  organizationName: string;
  recruitCloseAt: number | null;
  viewCount: number | null;
  thumbnailImage?: { __ref: string } | null;
}

interface NextData {
  props: {
    pageProps: {
      __APOLLO_STATE__: Record<string, unknown>;
    };
  };
}

function extractNextData(html: string): NextData {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) {
    throw new Error("__NEXT_DATA__ 스크립트를 찾을 수 없습니다 (페이지 구조 변경 가능성)");
  }
  return JSON.parse(match[1]) as NextData;
}

function resolveThumbnail(
  apollo: Record<string, unknown>,
  ref: { __ref: string } | null | undefined,
): string | null {
  if (!ref) return null;
  const file = apollo[ref.__ref] as { url?: string } | undefined;
  return file?.url ?? null;
}

/** ROOT_QUERY 안의 `activities({...})` 키에서 이번 요청에 해당하는 커넥션을 찾는다. */
function findActivitiesConnection(
  apollo: Record<string, unknown>,
  activityTypeID: string,
): { totalCount: number; nodes: { __ref: string }[] } | null {
  const rootQuery = apollo.ROOT_QUERY as Record<string, unknown> | undefined;
  if (!rootQuery) return null;
  const key = Object.keys(rootQuery).find(
    (k) => k.startsWith("activities(") && k.includes(`"activityTypeID":"${activityTypeID}"`),
  );
  if (!key) return null;
  return rootQuery[key] as { totalCount: number; nodes: { __ref: string }[] };
}

const ACTIVITY_TYPE_ID: Record<string, string> = {
  activity: "1",
  contest: "3",
  intern: "5",
};

async function fetchPage(path: string, page: number): Promise<NextData> {
  const url = `https://linkareer.com/list/${path}?page=${page}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    throw new Error(`링커리어 요청 실패: ${url} -> HTTP ${res.status}`);
  }
  const html = await res.text();
  return extractNextData(html);
}

export async function crawlLinkareer(category: ListingCategory): Promise<Listing[]> {
  const path = CATEGORY_PATH[category];
  if (!path) return [];

  const activityTypeID = ACTIVITY_TYPE_ID[path];
  const listings: Listing[] = [];
  let page = 1;
  let totalCount = Infinity;

  while ((page - 1) * 20 < totalCount) {
    if (config.linkareerMaxPages && page > config.linkareerMaxPages) break;

    const data = await fetchPage(path, page);
    const apollo = data.props.pageProps.__APOLLO_STATE__;
    const connection = findActivitiesConnection(apollo, activityTypeID);
    if (!connection) {
      console.warn(`[linkareer] ${category} page=${page}: activities 커넥션을 찾지 못함 — 중단`);
      break;
    }
    totalCount = connection.totalCount;

    for (const ref of connection.nodes) {
      const activity = apollo[ref.__ref] as ApolloActivity | undefined;
      if (!activity) continue;
      listings.push({
        source: "linkareer",
        sourceId: activity.id,
        category,
        title: activity.title,
        organization: activity.organizationName,
        url: `https://linkareer.com/activity/${activity.id}`,
        deadline: activity.recruitCloseAt
          ? new Date(activity.recruitCloseAt).toISOString()
          : null,
        thumbnailUrl: resolveThumbnail(apollo, activity.thumbnailImage),
        viewCount: activity.viewCount ?? null,
        crawledAt: new Date().toISOString(),
      });
    }

    page += 1;
    await sleep(config.requestDelayMs);
  }

  return listings;
}
