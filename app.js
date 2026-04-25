
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const redis = require("./src/config/Redis/redis.js")
const productRoutes = require("./src/routes/product.routes");
const rateLimiter = require("./src/middlewares/rateLimiter.js");
const asyncHandler = require("./src/middlewares/asyncHandler.js");
const { notFoundHandler, globalErrorHandler } = require("./src/middlewares/errorHandler.js");
const subscriber = require('./src/config/pubsub/subscriber.js');
const { publishEvent, buildEvent } = require('./src/config/pubsub/publisher.js');

const app = express()
app.use((req, res, next) => { console.log(req.url); next(); })

app.use(helmet())
//1. helmet() used for avoid XSS attack,
//2. to set various HTTP headers for security purposes,
//3.setting Content Security Policy (CSP) to restrict the sources of content that can be loaded on the page, 
//4. to set HTTP headers like X-Frame-Options to prevent clickjacking,




app.use(cors()) //origin = protocol +PORT + domain name + path  => http://localhost:3000 
//1. cors() is used to enable Cross-Origin Resource Sharing (CORS) in the Express application, allowing it to handle requests from different origins (domains).
//2. It adds the necessary HTTP headers to responses to allow browsers to make cross-origin requests, which is essential for APIs that are accessed from web applications hosted on different domains.


app.use(express.json()) // to parse JSON bodies in incoming requests
app.use(express.urlencoded({ extended: true })) // to parse URL-encoded bodies (like form submissions) in incoming requests

app.use('/api', rateLimiter);


app.get('/test-redis', asyncHandler(async (req, res) => {
    await redis.set("test:key", "Hello from Redis");
    const value = await redis.get("test:key");
    res.json({ value });
}));

app.post('/api/products/refresh-cache', asyncHandler(async (req, res) => {
    const CACHE_KEY = "Products:all";
    await redis.del(CACHE_KEY); // Deletes the cache entry for "Products:all" from Redis.
    res.json({ message: "Cache refreshed" });
}));

app.post("/api/publish", async (req, res) => {
    try {
        const { eventType, payload } = req.body;
        const event = buildEvent(eventType, payload) // Build a structured event message using the buildEvent helper function

        await publishEvent("handlers", event); 
        // Publish the event to the "handlers" channel using the publishEvent function,
        //  which sends the event data to Redis for subscribers to receive and process.

        res.json({ status: "Message published" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Publish failed" });
    }
});


app.use("/api", productRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(3000, () => {
    console.log("Server running on port 3000 : =>  ✅");
})



