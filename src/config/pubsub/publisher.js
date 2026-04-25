const Redis = require('ioredis');

const publisherClient = new Redis({
    host: "127.0.0.1"
    , port: 6379
});


publisherClient.on("connect", () => {
    console.log("📡 Publisher connected to Redis");
})

publisherClient.on("error", (err) => {
    console.error("❌ Publisher Redis error:", err);
})

const buildEvent = (eventType, payload) => {  // Helper function to build a structured event message
    return {
        eventType,
        payload,
        timeStamp: new Date().toISOString()
    };
}

async function publishEvent(channel, data) {
    try {
        const publisher = await publisherClient  // Get the Redis client instance
            .publish( // Publish the event to the specified channel
                channel, // The channel name to publish to
               JSON.stringify(data) // Convert the event data to a JSON string before publishing
            );
        console.log(`📤 Published to ${channel}:`, data);
    } catch (error) {
        console.error("❌ Publish failed:", error);
    }
}


module.exports = { publishEvent,buildEvent };