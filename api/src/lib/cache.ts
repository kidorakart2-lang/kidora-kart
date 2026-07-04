import NodeCache from "node-cache";

/**
 * Shared in-memory cache with a 5-minute default TTL.
 * Individual cache.set() calls can override the TTL per key.
 * Admin CRUD operations explicitly invalidate relevant cache keys.
 */
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes — safety net in case admin invalidation is missed
  checkperiod: 60, // check for expired keys every 60 seconds
});

export default cache;