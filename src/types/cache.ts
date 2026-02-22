export interface CacheEntry<T> {
  data: T;
  cachedAt: string; // ISO string
  expiresAt: string; // ISO string
}
