const THROTTLE_KEY_PREFIX = 'rl:';

interface ThrottleRule {
  key: string;
  maxPerWindow: number;
  windowMs: number;
}

export const THROTTLE_RULES = {
  confession: { key: 'confession', maxPerWindow: 3, windowMs: 60_000 },
  reply: { key: 'reply', maxPerWindow: 5, windowMs: 60_000 },
} as const satisfies Record<string, ThrottleRule>;

function load(key: string): number[] {
  try {
    const raw = localStorage.getItem(THROTTLE_KEY_PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

function save(key: string, stamps: number[]): void {
  try {
    localStorage.setItem(THROTTLE_KEY_PREFIX + key, JSON.stringify(stamps));
  } catch {
    // quota exceeded or localStorage unavailable — fail open
  }
}

export function checkThrottle(rule: ThrottleRule): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const stamps = load(rule.key).filter((t) => now - t < rule.windowMs);
  if (stamps.length >= rule.maxPerWindow) {
    const oldest = Math.min(...stamps);
    return { allowed: false, retryAfterMs: rule.windowMs - (now - oldest) };
  }
  return { allowed: true };
}

export function recordAction(rule: ThrottleRule): void {
  const now = Date.now();
  const stamps = load(rule.key).filter((t) => now - t < rule.windowMs);
  stamps.push(now);
  save(rule.key, stamps);
}
