---
"zohar": minor
---

-   Added `subscriber` helper function to create specialized subscription functions

    -   Type-safe event subscriptions with improved ergonomics
    -   Removes need to specify event name in listener functions
    -   Supports predicates for event filtering
    -   Returns unsubscribe function for cleanup

-   Added `emitter` helper function to create specialized emit functions

    -   Type-safe event emission with improved ergonomics
    -   Removes need to specify event name when emitting events
    -   Maintains full type safety for event data

-   Added `SpecializedEventListener<Event, EventType>` for simplified event listeners
-   Added `EventSubscriber<Event, EventType>` for specialized subscription functions
-   Added `EventSubscriberFactory<Event>` for subscription function factories
-   Added `EventEmitter<Event, EventType>` for specialized emit functions
-   Added `EventEmitterFactory<Event>` for emit function factories

-   Added comprehensive test suite for both helper functions
-   Coverage includes:

    -   Basic functionality
    -   Type safety verification
    -   Predicate handling
    -   Complex event types with intersection types
    -   Unsubscription behavior

-   Added detailed documentation for both helper functions
-   Included practical examples demonstrating:
    -   Component-specific event handling
    -   Module-specific event management
    -   Complex event types with intersection types
-   Added benefits section highlighting:
    -   Type safety
    -   Ergonomic API
    -   Better IDE support
    -   Modular design
    -   Reusability

None. This is a backward-compatible feature addition.

```typescript
type MyEvents = EventDescription<"userConnected", { userId: string }> &
	EventDescription<"userDisconnected", { userId: string; reason: "timeout" | "manual" }>;

const [subscribe, emit] = createEventEmitter<MyEvents>();

// Create specialized functions
const createSubscriber = subscriber(subscribe);
const createEmitter = emitter(emit);

const onUserConnected = createSubscriber("userConnected");
const emitUserConnected = createEmitter("userConnected");

// Use with improved ergonomics
onUserConnected(data => {
	console.log(`User ${data.userId} connected`);
});

emitUserConnected({ userId: "user123" });
```

```

```
