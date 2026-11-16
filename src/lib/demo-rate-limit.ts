export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 60 * 60 * 1000;
export const MAX_RATE_LIMIT_KEYS = 5000;

export type RateLimitState = Map<string, number[]>;

/** Bounded, per-instance limiter. Use a shared store or WAF for global limits. */
export function rateLimited(
  state: RateLimitState,
  ip: string,
  now = Date.now(),
): boolean {
  // Entries are ordered by their last accepted request. Remove expired entries
  // from the front, stopping as soon as a live entry is found.
  for (const [key, timestamps] of state) {
    const lastHit = timestamps[timestamps.length - 1];
    if (lastHit !== undefined && now - lastHit < RATE_WINDOW_MS) break;
    state.delete(key);
  }

  const timestamps = state.get(ip) ?? [];
  const recent = timestamps.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT) return true;

  // Keep active quotas intact when capacity is exhausted. Unknown IPs retry
  // after space becomes available through expiration.
  if (!state.has(ip) && state.size >= MAX_RATE_LIMIT_KEYS) return true;

  recent.push(now);
  state.delete(ip);
  state.set(ip, recent);

  return false;
}
