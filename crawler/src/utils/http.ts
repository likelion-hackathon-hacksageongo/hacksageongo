const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 HacksaeongoCrawler/0.1 (contact: bae.hjoon@gmail.com)";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 지수 백오프 재시도가 포함된 fetch. 4xx는 재시도하지 않는다(요청 자체가 잘못된 것이므로).
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  { retries = 3, baseDelayMs = 1000 }: { retries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": USER_AGENT, ...init.headers },
      });
      if (res.status >= 500 && attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
      }
    }
  }
  throw lastError ?? new Error(`fetch failed: ${url}`);
}
