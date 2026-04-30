interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const tracker = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MINUTE) || 30;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record) {
    tracker.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1';
}
