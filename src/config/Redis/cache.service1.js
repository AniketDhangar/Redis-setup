const redis = require('./redis.js');

async function getOrSetCache({ key, ttl, lockKey, fetchFunction }) {
    try {
        let cachedData;
        try {
            cachedData = await redis.get(key);
        } catch (error) {
            console.error("❌ Redis GET failed:", error.message);
            // Proceed without cache on Redis failure (fail-open)
        }


        if (cachedData) {
            console.log("Cache hit for key:", key);
            refreshInBackground({ key, ttl, lockKey, fetchFunction }); // Refresh cache in background
            return JSON.parse(cachedData);
        }
        return await fetchWithLock({ key, ttl, lockKey, fetchFunction });


    } catch (error) {
        console.error("Error accessing Redis cache:", error);
        return await fetchFunction(); // ALWAYS fallback
    }

}

async function fetchWithLock({ key, ttl, lockKey, fetchFunction, lockTTL = 10 }) {
    try {
        let lockValue = Date.now().toString();
        let isLocked = false;
        try {
            isLocked = await redis.set(lockKey, lockValue, "NX", "EX", lockTTL);
        } catch (error) {
            console.error("❌ Redis LOCK failed:", error.message);

        }


        if (isLocked) {
            try {
                console.log(`🔒 LOCK ACQUIRED → ${key}`);
                const data = await fetchFunction();

                try {

                    if (data !== undefined && data !== null) {
                        await redis.set(key, JSON.stringify(data), "EX", ttl);
                        console.log(`✅ Data stored in Redis with key:=>  ${key}`);
                    }
                } catch (error) {
                    console.error("❌ Redis SET failed:", error.message);
                }

                return data;
            } finally {
                try {
                    const currentLockValue = await redis.get(lockKey);
                    if (currentLockValue === lockValue) {
                        await redis.del(lockKey);
                        console.log(`🔓 LOCK released for key: ${key}`);
                    }
                } catch (error) {
                    console.error("❌ Redis UNLOCK failed:", error.message);

                }
            }
        } else {
            console.log("Lock already acquired by another process...");
        }

        //retry
        for (let i = 0; i < 3; i++) {
            await new Promise(res => setTimeout(res, 50 + Math.random() * 100));

            try {
                const retryCache = await redis.get(key);
                if (retryCache) {
                    console.log(`⚡ Cache hit after waiting → ${key}`);
                    return JSON.parse(retryCache);
                }
            } catch (error) {
                console.error("❌ Redis retry GET failed:", error.message);
            }
        }

        return await fetchFunction();

    } catch (error) {
        throw error;
        console.error("Error in fetchWithLock:", error);
    }
}

async function refreshInBackground({ key, ttl, lockKey, fetchFunction }) {
    try {
        setTimeout(() => {
            (async () => {
                const lockValue = Date.now().toString();
                const isLocked = await redis.set(lockKey, lockValue, "NX", "EX", 10);
                if (!isLocked) {
                    console.log("Background refresh skipped, lock already acquired...");
                    return;
                }

                try {
                    console.log(`🔒 LOCK ACQUIRED for background refresh → ${key}`);

                    const data = await fetchFunction();
                    await redis.set(key, JSON.stringify(data), "EX", ttl);  // Update cache with fresh data
                    console.log(`✅ Cache refreshed in background for key: ${key}`);
                } finally {
                    const currentLockValue = await redis.get(lockKey);
                    if (currentLockValue === lockValue) {
                        await redis.del(lockKey);
                        console.log(`🔓 LOCK released for background refresh → ${key}`);
                    }
                }
            }
            )()
        }, 0) // Defer to next event loop tick to avoid blocking response
    } catch (error) {
        console.log("Error in refreshInBackground:", error);
    }
}


module.exports = {
    getOrSetCache,
    fetchWithLock,
    refreshInBackground
}
