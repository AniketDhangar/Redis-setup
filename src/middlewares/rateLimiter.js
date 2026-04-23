const redis = require('../config/Redis/redis.js');

const rateLimiter = async (req, res, next) => {
    const userKey = req.user?._id || req.user?.id || req.ip || 'anonymous';
    const key = `rate_limit:${userKey}`;

    const limit = 10; // Max requests per time window
    const windowSize = 60; // Time window in seconds (1 minute)
    const now = Date.now();

    try {
        // Remove old entries outside the time window
        await redis.zremrangebyscore(key, 0, now - windowSize * 1000);

        // Get current request count
        const count = await redis.zcard(key);

        // Check if limit exceeded
        if (count >= limit) {
            return res.status(429).json({
                message: 'Too many requests. Please try again later.',
                retryAfter: windowSize
            });
        }

        // Add current request timestamp (score: timestamp, member: unique ID)
        const member = `${now}-${Math.random()}`;
        await redis.zadd(key, now, member);

        // Set expiration to clean up old keys (with some buffer)
        await redis.expire(key, windowSize * 2);

        // Calculate remaining requests (after this one)
        const newCount = count + 1;
        const remaining = Math.max(0, limit - newCount);

        // Set rate limit headers
        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', remaining);
        res.set('X-RateLimit-Reset', Math.floor((now + windowSize * 1000) / 1000));

        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        // On Redis failure, allow request to proceed (fail-open)
        next();
    }
};

module.exports = rateLimiter;