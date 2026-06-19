type Attempt = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, Attempt>();

export function checkRateLimit({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, {
      count: 1,
      resetAt: now + windowMs
    });

    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000)
    };
  }

  current.count += 1;
  attempts.set(key, current);

  return { allowed: true, retryAfter: 0 };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
