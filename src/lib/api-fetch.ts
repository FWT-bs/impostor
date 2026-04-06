export type ApiJsonResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data?: unknown; errorMessage: string };

const DEFAULT_TIMEOUT_MS = 45_000;

/**
 * POST JSON with cookies, timeout, and safe body parsing so UI loading states always clear.
 */
export async function postJson<T>(
  url: string,
  body: unknown,
  options?: { timeoutMs?: number }
): Promise<ApiJsonResult<T>> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    let data: unknown;
    if (text.length > 0) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        return {
          ok: false,
          status: res.status,
          errorMessage:
            text.length > 180 ? `${text.slice(0, 180)}…` : text || "Invalid JSON from server",
        };
      }
    }

    if (!res.ok) {
      const msg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : `Request failed (${res.status})`;
      return { ok: false, status: res.status, data, errorMessage: msg };
    }

    return { ok: true, status: res.status, data: data as T };
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      return {
        ok: false,
        status: 0,
        errorMessage: "Request timed out. Check your connection and try again.",
      };
    }
    return {
      ok: false,
      status: 0,
      errorMessage: e instanceof Error ? e.message : "Network error",
    };
  }
}
