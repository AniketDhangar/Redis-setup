
const axios = require('axios');
const { cache, buildCacheKey } = require('../config/Redis/cache.service.js');

const CACHE_TTL = 300; // seconds (5 min)

async function getProducts(page = 1, limit = 10) {
    // const key = buildCacheKey('products:all', { page, limit });
    const key = buildCacheKey('products:all')

    return await cache({
        key,
        ttl: CACHE_TTL,
        fetchFunction: async () => {
            console.log("🐢 Cache MISS - Calling API for products");
            const response = await axios.get(
                "https://fakestoreapiserver.reactbd.org/api/products",
                { timeout: 10000 }
            );
            return response.data;
        }
    });
}

async function getTodos() {
    const CACHE_KEY = "Todos:all";
    return await cache({
        key: CACHE_KEY,
        ttl: CACHE_TTL,
        fetchFunction: async () => {
            console.log("🐢 Cache MISS - Calling API for todos");
            const response = await axios.get(
                "https://jsonplaceholder.typicode.com/todos",
                { timeout: 10000 }
            );
            return response.data;
        }
    });
}

module.exports = {
    getProducts,
    getTodos
};