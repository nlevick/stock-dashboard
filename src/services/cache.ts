import { CacheEntry } from "@/types/cache";

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw) as CacheEntry<T>;
    if (new Date(entry.expiresAt) < new Date()) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
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
