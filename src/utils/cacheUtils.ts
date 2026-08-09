/**
 * Simple client-side caching utility for dashboard data
 */

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Get data from cache if available and not expired
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
export function getFromCache<T>(key: string): T | null {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    
    const { data, timestamp } = JSON.parse(cachedData);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Save data to cache with current timestamp
 * @param key Cache key
 * @param data Data to cache
 */
export function saveToCache<T>(key: string, data: T): void {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Clear a specific cache entry
 * @param key Cache key to clear
 */
export function clearCache(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Clear all cache entries with a specific prefix
 * @param prefix Prefix of cache keys to clear
 */
export function clearCacheByPrefix(prefix: string): void {
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key));
}