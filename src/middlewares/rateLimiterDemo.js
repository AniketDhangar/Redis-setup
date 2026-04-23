
const redis = require('../config/Redis/redis.js');


const rateLimiter = async (req, res, next) => {
    const userKey = req.user?._id || req.user?.id || req.ip || 'anonymous'; // Use IP address or user ID as the key for rate limiting
    const key = `rate_limit:${userKey}`;

    const limit = 10; // Max requests per time window
    const windowSize = 60; // Time window in seconds
    const now = Date.now();
    try {

        // removing old entries
        await redis.zremrangebyscore(key, 0, Date.now() - windowSize * 1000);

        //counting current requests
        const count = await redis.zcard(key); // Returns total number of elements in a sorted set

        // If the count exceeds the limit, block the request
        if (count >= limit) {
            return res
                .status(429)
                .json({ message: 'Too many requests. Please try again later.' });
        }

        // Adding current request timestamp
        await redis.zadd(key, now, `${now} - ${Math.random()}`);
        // Using a combination of timestamp and random value to ensure uniqueness in the sorted set, 
        // preventing collisions when multiple requests occur at the same millisecond.

        //setting expiration for the key
        await redis.expire(key, Math.ceil(windowSize)); // Set the expiration time for the key to ensure it doesn't persist indefinitely

        res.set('X-RateLimit-Limit', limit);   // this will help the client to know the limit of requests they can make
        res.set('X-RateLimit-Remaining', Math.max(0, limit - count)); // this will help the client to know how many requests they have left in the current window

        next();

    } catch (error) {
        console.error('Error in rate limiter:', error);
        next();
    }

}


module.exports = rateLimiter;

