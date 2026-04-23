const redis = require('./redis.js');

// ================= CONFIG =================
const DEFAULT_TTL = 300; // 5 min
const STALE_TTL = 600;   // allow stale data up to 10 min
const LOCK_TTL = 10;
const REQUEST_TIMEOUT = 5000;

// Circuit breaker state
let redisFailures = 0;
let redisDownUntil = 0;


// ================= UTILS =================

function isRedisAvailable() {
    if (Date.now() < redisDownUntil) return false;
    return true;
}

function recordRedisFailure() {
    redisFailures++;
    if (redisFailures >= 3) {
        redisDownUntil = Date.now() + 10000; // disable for 10 sec
        console.error("🚨 Redis circuit OPEN (temporarily disabled)");
        redisFailures = 0;
    }
}

function recordRedisSuccess() {
    redisFailures = 0;
}

function timeoutPromise(ms) {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout exceeded")), ms)
    );
}

function redisCommandWithTimeout(redisPromise, ms) {
    const wrapped = Promise.race([
        redisPromise,
        timeoutPromise(ms)
    ]);
    redisPromise.catch(() => {}); // prevent unhandled rejection if it resolves later
    return wrapped;
}

const GET_TIMEOUT = 200;
const SET_TIMEOUT = 200;

function buildCacheKey(base, params = {}) {
    const query = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join(":");
    return query ? `${base}:${query}` : base;
}


// ================= MAIN =================

async function cache({ key, ttl = DEFAULT_TTL, fetchFunction }) {
    let cached = null;
    let redisAvailable = isRedisAvailable();

    if (redisAvailable) {
        try {
            cached = await redisCommandWithTimeout(redis.get(key), GET_TIMEOUT);
            recordRedisSuccess();
        } catch (err) {
            recordRedisFailure();
            redisAvailable = false;
            console.error("❌ Redis GET failed or timed out:", err.message);
        }
    }

    // If we have a valid cache entry, return it immediately.
    if (cached) {
        try {
            const parsed = JSON.parse(cached);

            if (parsed.expiry > Date.now()) {
                console.log(`⚡ Cache HIT → ${key}`);
                refreshInBackground(key, ttl, fetchFunction);
                return parsed.data;
            }

            if (parsed.staleExpiry > Date.now()) {
                console.log(`⚠️ Serving STALE → ${key}`);
                refreshInBackground(key, ttl, fetchFunction);
                return parsed.data;
            }
        } catch (err) {
            console.warn(`⚠️ Invalid cache payload for ${key}:`, err.message);
        }
    }

    // No valid current cache: fetch live data directly.
    console.log(`🔄 Cache miss or Redis unavailable → fetching API for ${key}`);

    let data;
    try {
        data = await fetchFunction();
    } catch (err) {
        console.error("❌ API failed:", err.message);
        if (cached) {
            console.log("⚠️ Returning stale cache fallback");
            return JSON.parse(cached).data;
        }
        throw err;
    }

    // If Redis is available, update cache asynchronously.
    if (redisAvailable) {
        (async () => {
            try {
                const payload = {
                    data,
                    expiry: Date.now() + ttl * 1000,
                    staleExpiry: Date.now() + STALE_TTL * 1000
                };

                await redisCommandWithTimeout(redis.set(key, JSON.stringify(payload), "EX", STALE_TTL), SET_TIMEOUT);
                recordRedisSuccess();
                console.log(`✅ Cache stored → ${key}`);
            } catch (err) {
                recordRedisFailure();
                console.error("❌ Redis SET failed:", err.message);
            }
        })();
    }

    return data;
}


// ================= BACKGROUND REFRESH =================

function refreshInBackground(key, ttl, fetchFunction) {
    setTimeout(() => {
        (async () => {
            try {
                if (!isRedisAvailable()) return;

                const data = await fetchFunction();

                const payload = {
                    data,
                    expiry: Date.now() + ttl * 1000,
                    staleExpiry: Date.now() + STALE_TTL * 1000
                };

                await redisCommandWithTimeout(redis.set(key, JSON.stringify(payload), "EX", STALE_TTL), SET_TIMEOUT);
                console.log(`🔄 Cache refreshed → ${key}`);

            } catch (err) {
                recordRedisFailure();
                console.error("❌ Background refresh failed:", err.message);
            }
        })();
    }, 0);
}


// ================= METRICS (basic) =================

const metrics = {
    hits: 0,
    misses: 0,
    staleServed: 0
};

function trackHit() { metrics.hits++; }
function trackMiss() { metrics.misses++; }
function trackStale() { metrics.staleServed++; }


// ================= EXPORT =================

module.exports = {
    cache,
    buildCacheKey,
    metrics
};