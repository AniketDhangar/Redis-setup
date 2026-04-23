const Redis = require('ioredis');

const redis = new Redis({
    host: "127.0.0.1",     // Redis host (Docker exposed)
    port: 6379, //default port -> if having some erro with 6379 , we can use 6380 , also in docker c
    connectTimeout: 10000,
    commandTimeout: 200,
    maxRetriesPerRequest: 1,

    retryStrategy(times) {
        // Exponential backoff (production standard)
        return Math.min(times * 50, 2000);   //Prevents aggressive reconnect spam
    }

})

redis.on("ready", () => { // Indicates that the Redis client is fully initialized and ready to use.
    console.log("🔥 Redis READY");
});

redis.on("connect", () => {  //Confirms connection established
    console.log("✅ Redis connected");
})

redis.on("error", (err) => { // Logs failures (critical for debugging)
    console.error("❌ Redis error:", err.message);

})

module.exports = redis