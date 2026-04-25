const Redis = require('ioredis');

const subscriberClient = new Redis({
  host: "127.0.0.1",
  port: 6379
});

console.log("📡 Subscriber connected and waiting...");

// subscribe
subscriberClient.subscribe("handlers", (err, count) => {  // Subscribe to the "handlers" channel and log the result
  if (err) {
    console.error("❌ Subscribe failed:", err);
  } else {
    console.log(`✅ Subscribed to ${count} channel(s)`);
  }
});

// handlers map
const handlers = {  // Define handlers for different event types
  USER_CREATED: (data) => { // Handler for USER_CREATED events 
    console.log("👤 USER_CREATED:", data);
  },
  USER_UPDATED: (data) => {
    console.log("✏️ USER_UPDATED:", data);
  },
  USER_DELETED: (data) => {
    console.log("🗑️ USER_DELETED:", data);
  }
};


//use of .on is listen event of redis client 
//"message" is event name which is emitted when a message is received on a subscribed channel.
//  channel (the name of the channel the message was received on) and 
// message (the actual message content, which is expected to be a JSON string that can be parsed into an object containing eventType and payload).

// message listener
subscriberClient.on("message", (channel, message) => { // Listen for messages on the subscribed channel and process them
  try { 
    const parsed = JSON.parse(message);  // Parse the incoming message as JSON to extract eventType and payload
    console.log(`📡 [${channel}]`, parsed);

    const { eventType, payload } = parsed;    // Extract eventType and payload from the parsed message
    if (!eventType) {
      console.warn("⚠️ Missing eventType:", parsed);
      return;
    }

    const handler = handlers[eventType];  // Look up the appropriate handler function based on the eventType
    if (!handler) {
      console.warn(`⚠️ No handler for: ${eventType}`);
      return;
    }

    handler(payload);  // Call the handler function with the payload to process the event

  } catch (err) {
    console.error("❌ Invalid message format:", message);
  }
});

module.exports = subscriberClient;