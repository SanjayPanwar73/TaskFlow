const createAuthRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 10 } = {}) => {
  const store = new Map();

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const bucket = store.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      store.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.expiresAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: 'Too many authentication attempts. Please try again later.',
      });
    }

    bucket.count += 1;
    return next();
  };
};

const securityHeaders = (req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};

module.exports = {
  createAuthRateLimiter,
  securityHeaders,
};
