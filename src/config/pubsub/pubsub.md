## what is Pub/Sub?
1.pub = publisher => send message to channel
2.sub = subscriber => receive message from channel

-- one line definition => 
pub/sub is a messaging pattern where publishers send messages to channels and subscribers receive messages from those channels without direct communication between publishers and subscribers.
basically , channels act as middleman  that  sapararates publishers and subscribers , allowing for decoupling and scalability in communication.

## parts of pub  sub model
1.publisher => send message to channel  
2.subscriber => receive message from channel
3.channel => logical communication pathway that connects publishers and subscribers
4.message => data sent by publisher to channel

## how to use pub/sub in redis
A.create publisher client  redis.createClient() and connect to redis server 
    A.1 => publisherClient.publish(channel, message) => publish message to channel.

B.create subscriber client redis.createClient() and connect to redis server
    B.1 => subscriberClient.subscribe(channel) => subscribe to channel to receive messages.
    B.2 => subscriberClient.on("message", (channel, message) => {}) => listen for messages on subscribed channel and process them when received.

## real world use case
1. real time notifications => when user perform action like comment or like, publish event to channel and subscribers can listen to that channel to send real time notifications to users.

2. chat applications => when user send message, publish message to channel and other users subscribed to that channel can receive the message in real time.

3. live updates => when data changes, publish update to channel and subscribers can listen to that channel to get live updates.

## advantages of pub/sub
1. decoupling => publishers and subscribers are decoupled, they do not need to know about each other, they only need to know about the channel.
2. scalability => pub/sub allows for easy scaling, as publishers and subscribers can be added or removed without affecting each other.
3. real time communication => pub/sub enables real time communication between different parts of an application or different applications

## disadvantages of pub/sub
1. message loss => if a subscriber is not connected when a message is published, it will miss that message, as Redis Pub/Sub does not store messages for later delivery.
2. no message persistence => messages are not persisted, so if Redis server restarts, all messages will be lost.
3. no message ordering => messages may not be received in the order they were published, especially if there are multiple publishers or subscribers.

## best practices
1. use meaningful channel names => use descriptive channel names to make it clear what type of messages are being published and subscribed to. 
eg. "user:created" for user creation events, 
    "order:updated" for order updates.


2. handle message loss => implement retry logic or use a message queue if message loss is a concern for your application.

3. monitor performance => keep an eye on the performance of your Redis server, as a high volume of messages can impact performance. Consider using Redis Cluster or sharding if necessary.

4. secure your channels => if your application handles sensitive data, consider implementing authentication and authorization mechanisms to control access to your channels.

## FAQ about pub/sub
1. Can I use pub/sub for critical messages that must not be lost?
   - No, Redis Pub/Sub does not guarantee message delivery, so it is not suitable for critical messages that must not be lost. Consider using a message queue like Redis Streams or RabbitMQ for such use cases.
2. Can I have multiple subscribers for the same channel?
   - Yes, multiple subscribers can subscribe to the same channel and will receive all messages published to that channel.
3. Can I have multiple publishers for the same channel?
   - Yes, multiple publishers can publish messages to the same channel, and all subscribers to that channel will receive those messages.
4. How do I handle message processing in subscribers?
   - In the subscriber's message handler, you can implement the logic to process the incoming messages based on their content. You can use a switch statement or a mapping of event types to handler functions to organize your message processing logic effectively.
5. Can I use pub/sub for inter-service communication in a microservices architecture?
   - Yes, pub/sub can be used for inter-service communication in a microservices architecture, allowing services to communicate asynchronously without tight coupling. However, keep in mind the limitations of Redis Pub/Sub regarding message loss and consider using a more robust messaging system if reliability is a concern.
