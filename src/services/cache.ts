interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function getCache<T>(
  key: string,
  isPayload: (data: unknown) => data is T,
): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: unknown = JSON.parse(raw);
    if (!isCacheEntry(entry)) return null;
    if (Date.parse(entry.expiresAt) <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return isPayload(entry.data) ? entry.data : null;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    const now = new Date();
    const entry: CacheEntry<T> = {
      data,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Fail silently so localStorage can throw if storage quota is exceeded
  }
}

function isCacheEntry(value: unknown): value is CacheEntry<unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  if (!("cachedAt" in value && "expiresAt" in value && "data" in value)) return false;
  return (
    isIsoTimestamp(value.cachedAt) &&
    isIsoTimestamp(value.expiresAt) &&
    value.cachedAt < value.expiresAt
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value;
}
