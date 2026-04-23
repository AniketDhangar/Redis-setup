# Redis Flow in App

## Redis Flow
- **Cache Check**: `redisEnterprize.js` checks Redis for valid cache using `redis.get(key)` with 200ms timeout.
- **Hit**: Return cached data immediately, trigger background refresh if stale.
- **Miss/Failure**: Skip Redis, fetch live API data directly.
- **Store**: After live fetch, store result in Redis asynchronously using `redis.set()` with 200ms timeout.
- **Circuit Breaker**: Tracks Redis failures; if 3+ failures, disable Redis for 10s.
- **Fallback**: If API fails, return stale cache if available.

## App Flow (Text)
Request → app.js Middleware → Routes → Controller → Service → redisEnterprize.js Cache → [Redis Check] → Cache Hit? Yes: Return Cached Data | No: Fetch Live API → Return API Data → Store in Redis Async


## Power what Redis can do for you:
- **Performance**: Fast in-memory access for frequently requested data.
- **Scalability**: Handles high read loads, reducing database strain.
- **Resilience**: Circuit breaker prevents cascading failures when Redis is down.
- **Flexibility**: Can cache various data types and support complex data structures.    
- **Cost Efficiency**: Reduces API calls and database queries, saving resources.
- **User Experience**: Faster responses improve user satisfaction and engagement.

## features of ths code - 
1.caching with TTL and stale data handling
2.circuit breaker for Redis failures
3.background refresh of stale cache
4.async cache updates to avoid blocking
5.basic metrics for cache performance (hits/misses)
6. redis locking to prevent thundering herd on cache miss
7. configurable retry strategy for Redis connection issues
8. modular design for easy integration and maintenance




