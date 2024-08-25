# miko<!-- omit in toc -->

[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://stand-with-ukraine.pp.ua)

A functional type-safe event emitter library with zero dependencies.

Miko (巫女) refers to a traditional shrine maiden in Japanese Shinto religion who serves as an intermediary between the gods and people, delivering divine messages. Similarly, the `miko` library acts as a conduit between events and subscribers, efficiently transmitting events to listeners and ensuring seamless, type-safe communication.

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
	- [1. Defining Events](#1-defining-events)
		- [Generic Events with Any Data Type](#generic-events-with-any-data-type)
		- [Different Events with the Same Data Type](#different-events-with-the-same-data-type)
		- [Different Events with Different Data Types](#different-events-with-different-data-types)
	- [2. Subscribing to Events](#2-subscribing-to-events)
		- [What is a Predicate?](#what-is-a-predicate)
		- [Using a Predicate](#using-a-predicate)
	- [3. Unsubscribing from Events](#3-unsubscribing-from-events)
	- [4. Subscribing Once to an Event](#4-subscribing-once-to-an-event)
		- [Using `once`](#using-once)
	- [5. Waiting for an Event with a Promise](#5-waiting-for-an-event-with-a-promise)
		- [Using `awaited`](#using-awaited)
	- [Commonalities Between `once` and `awaited`](#commonalities-between-once-and-awaited)
- [API Reference](#api-reference)
- [Comparison: `miko` vs. Node.js EventEmitter API](#comparison-miko-vs-nodejs-eventemitter-api)
	- [Overview](#overview)
	- [Usage Comparison](#usage-comparison)
		- [Example: Using `miko`](#example-using-miko)
		- [Example: Using Node.js EventEmitter](#example-using-nodejs-eventemitter)
	- [Type Safety and Unsubscription Perspective](#type-safety-and-unsubscription-perspective)
	- [Pros and Cons](#pros-and-cons)
		- [`miko`](#miko-1)
		- [Node.js EventEmitter](#nodejs-eventemitter)
	- [Conclusion](#conclusion)
- [Usage Examples](#usage-examples)
	- [Chat Module Usage](#chat-module-usage)
		- [Chat Module Implementation](#chat-module-implementation)
		- [Subscribing to Chat Events](#subscribing-to-chat-events)
			- [Available Events](#available-events)
			- [Example: Subscribing to Events](#example-subscribing-to-events)
		- [Unsubscribing from Chat Events](#unsubscribing-from-chat-events)
			- [Example: Unsubscribing from Events](#example-unsubscribing-from-events)
		- [Internal Logic](#internal-logic)
		- [Chat Module Summary](#chat-module-summary)
	- [One-Time Login Event Handling with `awaited` and `once`](#one-time-login-event-handling-with-awaited-and-once)
		- [Login Module Implementation](#login-module-implementation)
		- [Consumer Usage Example with `awaited`](#consumer-usage-example-with-awaited)
		- [Consumer Usage Example with `once`](#consumer-usage-example-with-once)
		- [Explanation](#explanation)
		- [Login Module Summary](#login-module-summary)
- [License](#license)

## Features

- **Type-safe**: Ensures that emitted events match the expected data types.
- **Zero dependencies**: Lightweight and easy to integrate.
- **Flexible event definitions**: Supports different events with different or the same data types.
- **Intuitive API**: Easy-to-use methods for subscribing, emitting, and unsubscribing from events.

## Installation

Install the library using npm or yarn:

```bash
npm install miko
```

or

```bash
yarn add miko
```

## Usage

### 1. Defining Events

#### Generic Events with Any Data Type

For scenarios where events have various data types, you can define a generic event description:

```typescript
import { EventDescription, createEventEmitter } from 'miko';

// Define a generic event description
type GenericEvents = EventDescription<string, any>;

// Create an event emitter
const [subscribe, emit, unsubscribeAll] = createEventEmitter<GenericEvents>();

// Subscribe to any event with string-based event names
subscribe('someEvent', (eventName, data) => {
    console.log(`Received ${eventName} with data:`, data);
});

// Emit the event
emit('someEvent', { message: 'Hello World!' });
```

#### Different Events with the Same Data Type

In cases where different events share the same data structure, you can define the event description accordingly:

```typescript
import { EventDescription, createEventEmitter } from 'miko';

// Define event descriptions for user events
type UserEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;

// Create an event emitter
const [subscribe, emit, unsubscribeAll] = createEventEmitter<UserEvents>();

// Subscribe to 'userLogin' event
subscribe('userLogin', (eventName, data) => {
    console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

// Subscribe to 'userLogout' event
subscribe('userLogout', (eventName, data) => {
    console.log(`User ${data.userId} logged out at ${data.timestamp}`);
});

// Emit the events
emit('userLogin', { userId: 'user123', timestamp: new Date() });
emit('userLogout', { userId: 'user123', timestamp: new Date() });
```

#### Different Events with Different Data Types

If you have events with different data structures, you can combine event descriptions:

```typescript
import { EventDescription, createEventEmitter } from 'miko';

// Define event descriptions with varying data types
type UserEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>
    & EventDescription<'userRegister', { email: string; password: string; timestamp: Date }>;

// Create an event emitter
const [subscribe, emit, unsubscribeAll] = createEventEmitter<UserEvents>();

// Subscribe to 'userLogin' event
subscribe('userLogin', (eventName, data) => {
    console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

// Subscribe to 'userLogout' event
subscribe('userLogout', (eventName, data) => {
    console.log(`User ${data.userId} logged out at ${data.timestamp}`);
});

// Subscribe to 'userRegister' event
subscribe('userRegister', (eventName, data) => {
    console.log(`User registered with email ${data.email} at ${data.timestamp}`);
});

// Emit the events
emit('userLogin', { userId: 'user123', timestamp: new Date() });
emit('userLogout', { userId: 'user123', timestamp: new Date() });
emit('userRegister', { email: 'user@example.com', password: 'securePassword', timestamp: new Date() });
```

### 2. Subscribing to Events

You can subscribe to events with or without predicates.

#### What is a Predicate?

A **predicate** is a function that returns a boolean value (`true` or `false`) based on the evaluation of some condition on the event data. When you subscribe to an event with a predicate, the event will only trigger the listener if the predicate function returns `true` for the given event data.

This feature allows you to filter events, ensuring that only specific events that meet certain criteria trigger the listener.

#### Using a Predicate

For example, you might want to listen to a `userLogin` event only if the `userId` matches a specific value:

```typescript
import { EventDescription, createEventEmitter } from 'miko';

// Define event descriptions for user events
type UserEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;

// Create an event emitter
const [subscribe, emit, unsubscribeAll] = createEventEmitter<UserEvents>();

// Predicate function to filter for a specific user ID
const predicate = (data: { userId: string }) => data.userId === 'user123';

// Subscribe to the 'userLogin' event with the predicate
subscribe('userLogin', (eventName, data) => {
    console.log(`Specific user ${data.userId} logged in at ${data.timestamp}`);
}, predicate);

// Emit events
emit('userLogin', { userId: 'user123', timestamp: new Date() }); // This will trigger the listener
emit('userLogin', { userId: 'anotherUser', timestamp: new Date() }); // This will not trigger the listener
```

### 3. Unsubscribing from Events

You can unsubscribe individual listeners or all listeners for a specific event or all events:

```typescript
// Unsubscribe from a specific listener
const unsubscribe = subscribe('userLogin', (eventName, data) => {
    console.log(`User ${data.userId} logged in`);
});
unsubscribe(); // This removes the listener

// Unsubscribe all listeners for 'userLogin'
unsubscribeAll('userLogin');

// Unsubscribe all listeners for all events
unsubscribeAll();
```

### 4. Subscribing Once to an Event

The `once` utility function allows you to subscribe to an event and automatically unsubscribe after the event is triggered for the first time. This is useful when you only need to handle an event a single time.

#### Using `once`

```typescript
import { EventDescription, createEventEmitter, once } from 'miko';

// Define event descriptions for user events
type UserEvents = EventDescription<'userLogin', { userId: string; timestamp: Date }>;

// Create an event emitter
const [subscribe, emit] = createEventEmitter<UserEvents>();

// Subscribe to the 'userLogin' event only once
const onceSubscribe = once(subscribe);

onceSubscribe('userLogin', (eventName, data) => {
    console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

// Emit the event twice
emit('userLogin', { userId: 'user123', timestamp: new Date() });
emit('userLogin', { userId: 'user123', timestamp: new Date() }); // This will not trigger the listener
```

### 5. Waiting for an Event with a Promise

The `awaited` utility function allows you to subscribe to an event and return a promise that resolves when the event is triggered. This is useful for handling asynchronous events in a promise-based workflow.

#### Using `awaited`

```typescript
import { EventDescription, createEventEmitter, awaited } from 'miko';

// Define event descriptions for user events
type UserEvents = EventDescription<'userLogin', { userId: string; timestamp: Date }>;

// Create an event emitter
const [subscribe, emit] = createEventEmitter<UserEvents>();

// Subscribe to the 'userLogin' event and return a promise
const awaitedSubscribe = awaited(subscribe);

awaitedSubscribe('userLogin').then((data) => {
    console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

// Emit the event
emit('userLogin', { userId: 'user123', timestamp: new Date() });
```

### Commonalities Between `once` and `awaited`

Both `once` and `awaited` utilities are designed to handle a single occurrence of an event, and they automatically unsubscribe after the event is triggered. 

- **Type Safety**: Both `once` and `awaited` are type-safe, ensuring that the event data adheres to the defined types, reducing the risk of runtime errors.
- **Automatic Unsubscription**: After the event is triggered once, both utilities automatically unsubscribe, preventing any further triggers of the event.
  
**Key Difference**:

- **Callback vs. Promise**: 
  - `once` is callback-based, allowing you to pass a function that will be invoked when the event occurs.
  - `awaited` utilizes the Promise API, returning a promise that resolves with the event data, making it ideal for asynchronous workflows.

By understanding these commonalities and differences, you can choose the right tool based on your specific use case and coding style preferences.

## API Reference

- **`EventDescription<EventType extends string, EventDataType = void>`**: Describes an event mapping where each event type is associated with a data type.
- **`createEventEmitter<Event extends EventDescription<string, any> = EventDescription<string, any>>()`**: Creates an event emitter providing `subscribe`, `emit`, and `unsubscribeAll` functions.
- **`SubscribeEvent<Event extends EventDescription<string, any>>`**: Function type to subscribe to an event, optionally with a predicate.
- **`EmitEvent<Event extends EventDescription<string, any>>`**: Function type to emit an event with the associated data.
- **`UnsubscribeEvent`**: Function type to unsubscribe a specific event listener.
- **`UnsubscribeAllEvents<Event extends EventDescription<string, any>>`**: Function type to unsubscribe all listeners for a specific event or all events.
- **`SubscribeOnce<Event extends EventDescription<string, any>>`**: Function type to subscribe to an event that automatically unsubscribes after being triggered once.
- **`once<Event extends EventDescription<string, any>>(subscribe: SubscribeEvent<Event>): SubscribeOnce<Event>`**: Utility function to create a subscription that triggers only once and then automatically unsubscribes.
- **`SubscribeAwaited<Event extends EventDescription<string, any>>`**: Function type to subscribe to an event and return a promise that resolves when the event is triggered.
- **`awaited<Event extends EventDescription<string, any>>(subscribe: SubscribeEvent<Event>): SubscribeAwaited<Event>`**: Utility function that returns a promise that resolves when the specified event is triggered, automatically unsubscribing afterward.

## Comparison: `miko` vs. Node.js EventEmitter API

The `miko` library and Node.js's built-in `EventEmitter` API serve similar purposes: both are used to emit and listen to events in an application. However, they differ significantly in their design, especially regarding type safety and ease of use when unsubscribing from events.

### Overview

- **`miko`**: A functional, type-safe event emitter library designed for TypeScript. It emphasizes type safety, ensuring that emitted events and their associated data types are correctly managed. It also simplifies subscription management by returning an `unsubscribe` function.
- **Node.js EventEmitter**: A widely-used, built-in event emitter API in Node.js. It is flexible but lacks native type safety, which can lead to runtime errors if not used carefully. Managing event unsubscription can be more cumbersome.

### Usage Comparison

#### Example: Using `miko`

Here’s how you would use `miko` for type-safe event handling:

```typescript
import { EventDescription, createEventEmitter } from 'miko';

// Define event descriptions with specific types
type MyEvents = 
    EventDescription<'eventA', { message: string }> &
    EventDescription<'eventB', { value: number }>;

// Create an event emitter
const [subscribe, emit] = createEventEmitter<MyEvents>();

// Subscribe to events
const unsubscribeEventA = subscribe('eventA', (eventName, data) => {
    console.log(`Event A: ${data.message}`);
});

const unsubscribeEventB = subscribe('eventB', (eventName, data) => {
    console.log(`Event B: ${data.value}`);
});

// Emit events
emit('eventA', { message: 'Hello World' });
emit('eventB', { value: 42 });

// Unsubscribe when done
unsubscribeEventA();
unsubscribeEventB();
```

#### Example: Using Node.js EventEmitter

Here’s how you would use the Node.js EventEmitter for similar functionality:

```typescript
import { EventEmitter } from 'node:events';

// Create an instance of EventEmitter
const eventEmitter = new EventEmitter();

// Define listener functions so they can be referenced later
const onEventA = (data: { message: string }) => {
    console.log(`Event A: ${data.message}`);
};

const onEventB = (data: { value: number }) => {
    console.log(`Event B: ${data.value}`);
};

// Subscribe to events
eventEmitter.on('eventA', onEventA);
eventEmitter.on('eventB', onEventB);

// Emit events
eventEmitter.emit('eventA', { message: 'Hello World' });
eventEmitter.emit('eventB', { value: 42 });

// Unsubscribe when done
eventEmitter.off('eventA', onEventA);
eventEmitter.off('eventB', onEventB);
```

### Type Safety and Unsubscription Perspective

- **`miko`**:
  - **Type-Safe by Design**: In `miko`, event names and associated data types are defined upfront, ensuring that only valid events with the correct data structure can be emitted. TypeScript will catch any mismatches at compile time, significantly reducing the risk of runtime errors.
  - **Type Inference**: When you emit or subscribe to an event, TypeScript knows exactly what data type is expected, offering full type inference and autocompletion within your IDE.
  - **Simple Unsubscription**: The `subscribe` function in `miko` returns an `unsubscribe` function, making it easy to remove listeners even when they are defined inline. This avoids the complexity of managing listener references manually.

- **Node.js EventEmitter**: 
  - **No Native Type Safety**: The Node.js EventEmitter API is inherently untyped, meaning you can emit any event with any data, and TypeScript won't provide any safety checks. This can lead to potential runtime errors if the wrong data is emitted or if a listener expects a different data structure.
  - **Complex Unsubscription**: The `off` (or `removeListener`) method requires the exact reference to the original listener function. If the listener was defined inline, it's difficult to unsubscribe because you need to store the listener function in a variable for later reference. This adds complexity and makes the code harder to manage.

### Pros and Cons

#### `miko`

**Pros**:

- **Strong Type Safety**: Prevents runtime errors by enforcing event types and data structures at compile time.
- **Cleaner Code**: Type-safe events lead to more maintainable and readable code, as the expected structure is always clear.
- **IDE Support**: Full TypeScript support with autocompletion and type inference.
- **No Instance Required**: Unlike traditional event emitters that require an instance, `miko` directly provides the `subscribe` and `emit` functions, making them ready to use without needing to create or manage an emitter object.
- **Better Separation of Concerns**: Since `miko` provides just functions, it's easier to split emitter and consumer functionalities across different modules or components. This makes the code more modular and aligns well with the principles of separation of concerns.
- **Easier Unsubscription**: The `unsubscribe` function returned by `subscribe` makes it straightforward to remove listeners, even if they are defined inline, reducing the risk of accidentally leaving listeners active.

**Cons**:

- **Learning Curve**: Developers unfamiliar with TypeScript’s advanced type features might find the initial setup slightly more complex.
- **Overhead**: In small or simple projects where type safety is less of a concern, the strict typing might feel unnecessary.

#### Node.js EventEmitter

**Pros**:

- **Simplicity**: Easy to use and widely understood, as it is a built-in Node.js feature.
- **Flexibility**: No need to define types upfront, making it quicker to implement in simple scenarios.

**Cons**:

- **Lack of Type Safety**: High risk of runtime errors due to the absence of compile-time checks, especially in larger projects.
- **Maintenance**: As projects grow, ensuring that event names and data structures remain consistent becomes challenging without type safety.
- **Requires an Instance**: You must create and manage an instance of `EventEmitter` to use it. This can add unnecessary boilerplate in scenarios where just functions would suffice.
- **Tighter Coupling**: The need for an emitter instance can lead to tighter coupling between event production and consumption, making it harder to separate these concerns in larger applications.
- **Complex Unsubscription**: Requires storing listener references to unsubscribe, which complicates the code, especially when trying to manage listeners that are defined inline.

### Conclusion

- **When to Use `miko`**: If you’re working on a TypeScript project where maintaining type safety and avoiding runtime errors is critical, `miko` is the better choice. It provides strong type guarantees, making your codebase more robust and easier to maintain. Additionally, if you prefer functional programming and want a clear separation between event producers and consumers, `miko` offers a cleaner, more modular approach with simpler unsubscription.
  
- **When to Use Node.js EventEmitter**: If you’re in a Node.js environment and need a quick and flexible event emitter for a smaller, simpler project, the built-in EventEmitter might suffice, but be aware of the potential for type-related issues, the need to manage instances, and the complexity of handling unsubscriptions.

## Usage Examples

### Chat Module Usage

The Chat Module handles all internal chat logic and emits events when users connect, disconnect, or send messages. As a consumer, you can subscribe to these events to react to user activities. Additionally, the module allows you to unsubscribe from events when they are no longer needed, ensuring efficient resource management.

#### Chat Module Implementation

The Chat Module is implemented as a functional module that encapsulates all chat-related logic. It emits events internally when users perform actions such as connecting, disconnecting, or sending messages. The module exposes only a `subscribe` function (`onChatEvent`) for external use.

```typescript
import { EventDescription, createEventEmitter } from 'miko';

// Define distinct event descriptions for the chat application
type ChatEvents = 
    EventDescription<'userConnected', { userId: string; timestamp: Date }> &
    EventDescription<'userDisconnected', { userId: string; timestamp: Date }> &
    EventDescription<'messageReceived', { userId: string; message: string; timestamp: Date }>;

// Create an event emitter for chat events
const [subscribe, emit] = createEventEmitter<ChatEvents>();

// Internal logic that might use something like Redis events, databases, etc.
// Pseudocode for event handling

// Simulate user connection
setTimeout(() => {
    const userId = 'user123';
    const timestamp = new Date();
    emit('userConnected', { userId, timestamp });
}, 1000); // Simulate user connection after 1 second

// Simulate user message
setTimeout(() => {
    const userId = 'user123';
    const message = 'Hello World!';
    const timestamp = new Date();
    emit('messageReceived', { userId, message, timestamp });
}, 2000); // Simulate message after 2 seconds

// Simulate user disconnection
setTimeout(() => {
    const userId = 'user123';
    const timestamp = new Date();
    emit('userDisconnected', { userId, timestamp });
}, 3000); // Simulate user disconnection after 3 seconds

// Expose the subscribe function directly
export { subscribe as onChatEvent };
```

#### Subscribing to Chat Events

To listen to chat events such as user connections, disconnections, and messages, you can use the `onChatEvent` function. This function allows you to subscribe to specific events and handle them as needed.

##### Available Events

- **`userConnected`**: Triggered when a user connects.
- **`userDisconnected`**: Triggered when a user disconnects.
- **`messageReceived`**: Triggered when a user sends a message.

##### Example: Subscribing to Events

```typescript
import { onChatEvent } from './chatService';

// Listen for user connection
const unsubscribeUserConnected = onChatEvent('userConnected', (eventName, data) => {
    console.log(`User ${data.userId} connected at ${data.timestamp}`);
});

// Listen for user disconnection
const unsubscribeUserDisconnected = onChatEvent('userDisconnected', (eventName, data) => {
    console.log(`User ${data.userId} disconnected at ${data.timestamp}`);
});

// Listen for messages received
const unsubscribeMessageReceived = onChatEvent('messageReceived', (eventName, data) => {
    console.log(`Message from ${data.userId}: "${data.message}" at ${data.timestamp}`);
});
```

#### Unsubscribing from Chat Events

Each subscription returns an `unsubscribe` function, which you can call to stop listening to that event. This is useful when you no longer need to respond to an event, helping to optimize resource usage.

##### Example: Unsubscribing from Events

In the following example, we subscribe to the `messageReceived` event and then unsubscribe from it after 2.5 seconds.

```typescript
import { onChatEvent } from './chatService';

// Subscribe to the messageReceived event
const unsubscribeMessageReceived = onChatEvent('messageReceived', (eventName, data) => {
    console.log(`Message from ${data.userId}: "${data.message}" at ${data.timestamp}`);
});

// Unsubscribe after 2.5 seconds
setTimeout(() => {
    console.log('Unsubscribing from messageReceived event');
    unsubscribeMessageReceived(); // Stop listening to messages
}, 2500);
```

#### Internal Logic

The Chat Module handles events such as user connections, disconnections, and messages internally. This logic could involve interactions with databases, message brokers like Redis, or other systems. The specifics of these operations are encapsulated within the module, making it a "black box" to the consumer. The only interaction point for consumers is the `onChatEvent` function.

#### Chat Module Summary

The Chat Module provides a straightforward API for subscribing to and unsubscribing from chat-related events. By encapsulating all the complex internal logic, the module offers a clean and efficient way for consumers to react to user activities without needing to manage the underlying event handling mechanisms.

### One-Time Login Event Handling with `awaited` and `once`

The following example demonstrates how to handle a one-time login event in a browser environment using the `miko` library's `awaited` and `once` utility functions. The login process is encapsulated within a fictional module that interacts with an API and emits various events based on different operations. For illustration purposes, we focus on handling the `login` event.

#### Login Module Implementation

This fictional module simulates an API login request. It emits a single `login` event with a discriminated union type that indicates whether the login was successful or not. The module could emit other events as well, but here we illustrate the usage of the `login` event. The module exposes a specific function, `onLoginEvent`, for subscribing to the `login` event.

```typescript
import { EventDescription, createEventEmitter } from 'miko';

// Define event descriptions with a discriminated union for login results
type LoginResult = 
    | { success: true; userId: string; token: string }
    | { success: false; error: string };

type LoginEvents = EventDescription<'login', LoginResult>;

// Create an event emitter for login events (and potentially other events)
const [subscribe, emit] = createEventEmitter<LoginEvents>();

// Simulated login function that interacts with an API
async function login(username: string, password: string) {
    try {
        // Simulate an API request with a timeout
        const response = await fakeApiLoginRequest(username, password);

        // Emit a successful login event
        emit('login', { success: true, userId: response.userId, token: response.token });
    } catch (error) {
        // Emit a failed login event
        emit('login', { success: false, error: error.message });
    }
}

// Simulated API login request function
function fakeApiLoginRequest(username: string, password: string): Promise<{ userId: string; token: string }> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (username === 'correctUser' && password === 'correctPassword') {
                resolve({ userId: 'user123', token: 'abcdef' });
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1000); // Simulate a 1-second API response time
    });
}

// Expose the subscribe function specifically for the login event
export { subscribe as onLoginEvent, login };
```

#### Consumer Usage Example with `awaited`

The consumer uses the `awaited` function to wait for the `login` event. The function resolves the promise if the login is successful and rejects it if the login fails, all based on the discriminated union type.

```typescript
import { onLoginEvent, login } from './loginService';
import { awaited } from 'miko';

async function attemptLogin(username: string, password: string): Promise<{ userId: string; token: string }> {
    // Trigger the login process
    login(username, password);

    // Use the `awaited` function to wait for the `login` event
    const awaitLoginEvent = awaited(onLoginEvent);
    const result = await awaitLoginEvent('login');

    // Throw an error if the login failed
    if (!result.success) {
        throw new Error(result.error); // Reject with the error message
    }

    // Return the successful login data
    return { userId: result.userId, token: result.token };
}

// Usage example
attemptLogin('correctUser', 'correctPassword')
    .then((data) => {
        console.log('Login successful!', data);
    })
    .catch((error) => {
        console.error('Login failed:', error.message);
    });
```

#### Consumer Usage Example with `once`

Alternatively, the consumer can use the `once` function to handle the `login` event. This function automatically unsubscribes after the event is triggered, providing a callback-based approach to handle the event.

```typescript
import { onLoginEvent, login } from './loginService';
import { once } from 'miko';

// Use the `once` function to handle the `login` event
const onceSubscribe = once(onLoginEvent);

onceSubscribe('login', (eventName, result) => {
    if (result.success) {
        console.log('Login successful!', result.userId, result.token);
    } else {
        console.error('Login failed:', result.error);
    }
});

// Trigger the login process
login('correctUser', 'correctPassword');
```

#### Explanation

- **Login Module**: The module provides a `login` function that simulates an API request. It emits a `login` event with a discriminated union type that indicates whether the login was successful or not. The module could also emit other events, but this example focuses on the `login` event.
- **Exposing the `onLoginEvent` Function**: The `onLoginEvent` function is specifically exposed to allow consumers to subscribe to the `login` event, making it clear what the function is intended for.
- **Promise-Based Consumer with `awaited`**: The consumer uses the `awaited` function to wait for the `login` event. The promise resolves with the login data if successful or throws an error if the login fails, all within a single event handler.
- **Callback-Based Consumer with `once`**: Alternatively, the consumer can use the `once` function to handle the `login` event. This approach automatically unsubscribes after the event is triggered, providing a more traditional callback mechanism without the need for Promises.

#### Login Module Summary

This implementation demonstrates how to handle a one-time login event using the `miko` event emitter library with both the `awaited` and `once` utility functions. The login module is fictional and is designed to illustrate the usage of the `miko` library in handling events, specifically focusing on the `login` event. The module could emit other events, but the examples provided focus on demonstrating two different approaches to handling a single `login` event in a promise-based and callback-based manner. This approach is particularly useful when you want to handle events asynchronously, with automatic subscription management and a unified way to handle both success and failure outcomes.

## License

This library is open-source and available under the [MIT License](LICENSE).
