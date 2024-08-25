// A type alias for `any` used to explicitly indicate potentially unsafe usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- We need it for parameter type
type UnsafeAny = any;

/**
 * Describes an event mapping, where each event type is associated with a data type.
 *
 * @template EventType - The union of event string literals.
 * @template EventDataType - The data type associated with each event type.
 *
 * @example
 * // Define an event mapping where 'click' and 'move' events have data type {x: number; y: number}.
 * type MyEventMapping = EventDescription<"click" | "move", {x: number; y: number}>;
 */
export type EventDescription<EventType extends string, EventDataType = void> = {
	[P in EventType]: EventDataType;
};

/**
 * Type for event listeners, which take the event name and associated data as parameters.
 *
 * @template Event - The event description type.
 * @template EventType - The specific event type within the event description.
 *
 * @example
 * // Define an event description type using EventDescription
 * type MyEventDescription = EventDescription<"click" | "move", { x: number; y: number }>;
 *
 * // Define a type for an event listener for 'click' events
 * type ClickEventListener = EventListener<MyEventDescription, 'click'>;
 *
 * // Example usage of the ClickEventListener type
 * const handleClick: ClickEventListener = (eventType, eventData) => {
 *   console.log(`Event Type: ${eventType}`);
 *   console.log(`Coordinates: (${eventData.x}, ${eventData.y})`);
 * };
 *
 * // Simulate an event call
 * handleClick('click', { x: 100, y: 200 });
 */
export type EventListener<
	Event extends EventDescription<string, UnsafeAny>,
	EventType extends keyof Event & string = keyof Event & string
> = (eventName: EventType, data: Event[EventType]) => void;

/**
 * Type for predicates used to filter which events the listener should handle.
 *
 * @template Event - The event description type.
 * @template EventType - The specific event type within the event description.
 * @example
 * // Assume we have an event description type for application events
 * type AppEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;
 *
 * // Create a predicate function to filter 'userLogin' events for a specific user
 * const isSpecificUserLogin: EventPredicate<AppEvents, 'userLogin'> = (eventData) => {
 *   return eventData.userId === 'specificUserId';
 * };
 *
 * // Usage example in an event emitter
 * const [subscribe, emit, unsubscribeAll] = createEventEmitter<AppEvents>();
 *
 * // Subscribe to the 'userLogin' event with the predicate
 * subscribe('userLogin', (eventName, data) => {
 *   console.log(`${data.userId} logged in at ${data.timestamp}`);
 * }, isSpecificUserLogin);
 *
 * // Emit events
 * emit('userLogin', { userId: 'specificUserId', timestamp: new Date() }); // This will trigger the listener
 * emit('userLogin', { userId: 'anotherUserId', timestamp: new Date() });  // This will be filtered out
 */
export type EventPredicate<
	Event extends EventDescription<string, UnsafeAny>,
	EventType extends keyof Event & string = keyof Event & string
> = (entry: Event[EventType]) => boolean;

/**
 * Function type to subscribe to an event, optionally with a predicate.
 *
 * @template Event - The event description type.
 *
 * @example
 * // Assume we have an event description type for application events
 * type AppEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;
 *
 * // Example listener function that logs when a user logs in
 * const logUserLogin: EventListener<AppEvents, 'userLogin'> = (eventName, data) => {
 *   console.log(`${data.userId} logged in at ${data.timestamp}`);
 * };
 *
 * // Predicate function to filter for a specific user ID
 * const isSpecificUser: EventPredicate<AppEvents, 'userLogin'> = (eventData) => {
 *   return eventData.userId === 'specificUserId';
 * };
 *
 * // Usage example in an event emitter
 * const [subscribe, emit, unsubscribeAll] = createEventEmitter<AppEvents>();
 *
 * // Subscribe to the 'userLogin' event with the listener and optional predicate
 * const unsubscribe = subscribe('userLogin', logUserLogin, isSpecificUser);
 *
 * // Emit events
 * emit('userLogin', { userId: 'specificUserId', timestamp: new Date() }); // This will trigger the listener
 * emit('userLogin', { userId: 'anotherUserId', timestamp: new Date() });  // This will be filtered out
 *
 * // Unsubscribe the listener
 * unsubscribe();  // This removes the listener for future events
 */
export type SubscribeEvent<Event extends EventDescription<string, UnsafeAny>> = <
	EventType extends keyof Event & string
>(
	eventName: EventType,
	listener: EventListener<Event, EventType>,
	predicate?: EventPredicate<Event, EventType>
) => UnsubscribeEvent;

/**
 * Function type to unsubscribe a specific event listener.
 *
 * @returns A boolean indicating if the unsubscription was successful.
 * @example
 * // Assume we have an event description type for application events
 * type AppEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;
 *
 * // Example listener function that logs when a user logs in
 * const logUserLogin: EventListener<AppEvents, 'userLogin'> = (eventName, data) => {
 *   console.log(`${data.userId} logged in at ${data.timestamp}`);
 * };
 *
 * // Usage example in an event emitter
 * const [subscribe, emit, unsubscribeAll] = createEventEmitter<AppEvents>();
 *
 * // Subscribe to the 'userLogin' event
 * const unsubscribe = subscribe('userLogin', logUserLogin);
 *
 * // Emit an event
 * emit('userLogin', { userId: 'specificUserId', timestamp: new Date() }); // This will trigger the listener
 *
 * // Unsubscribe the listener
 * const wasUnsubscribed = unsubscribe(); // This removes the listener
 * console.log(`Unsubscribed: ${wasUnsubscribed}`); // Logs true if the unsubscription was successful
 *
 * // Emit another event
 * emit('userLogin', { userId: 'specificUserId', timestamp: new Date() }); // This will NOT trigger the listener, since it was unsubscribed
 */
export type UnsubscribeEvent = () => boolean;

/**
 * Function type to unsubscribe all listeners for a specific event or all events.
 *
 * @template Event - The event description type.
 * @example
 * // Assume we have an event description type for application events
 * type AppEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;
 *
 * // Example listener function that logs when a user logs in
 * const logUserLogin: EventListener<AppEvents, 'userLogin'> = (eventName, data) => {
 *   console.log(`${data.userId} logged in at ${data.timestamp}`);
 * };
 *
 * // Example listener function that logs when a user logs out
 * const logUserLogout: EventListener<AppEvents, 'userLogout'> = (eventName, data) => {
 *   console.log(`${data.userId} logged out at ${data.timestamp}`);
 * };
 *
 * // Usage example in an event emitter
 * const [subscribe, emit, unsubscribeAll] = createEventEmitter<AppEvents>();
 *
 * // Subscribe to the 'userLogin' and 'userLogout' events
 * subscribe('userLogin', logUserLogin);
 * subscribe('userLogout', logUserLogout);
 *
 * // Emit events
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // This will trigger the login listener
 * emit('userLogout', { userId: 'user1', timestamp: new Date() }); // This will trigger the logout listener
 *
 * // Unsubscribe all listeners for the 'userLogin' event
 * unsubscribeAll('userLogin');
 *
 * // Emit events after unsubscribing 'userLogin' listeners
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // This will NOT trigger any listener
 * emit('userLogout', { userId: 'user1', timestamp: new Date() }); // This will still trigger the logout listener
 *
 * // Unsubscribe all listeners for all events
 * unsubscribeAll();
 *
 * // Emit events after unsubscribing all listeners
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // No listener will be triggered
 * emit('userLogout', { userId: 'user1', timestamp: new Date() }); // No listener will be triggered
 */
export type UnsubscribeAllEvents<Event extends EventDescription<string, UnsafeAny>> = <
	EventType extends keyof Event & string
>(
	eventName?: EventType
) => void;

/**
 * Function type to emit an event with the associated data.
 *
 * @template Event - The event description type.
 *
 * @example
 * // Assume we have an event description type for application events
 * type AppEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;
 *
 * // Example listener function that logs when a user logs in
 * const logUserLogin: EventListener<AppEvents, 'userLogin'> = (eventName, data) => {
 *   console.log(`${data.userId} logged in at ${data.timestamp}`);
 * };
 *
 * // Example listener function that logs when a user logs out
 * const logUserLogout: EventListener<AppEvents, 'userLogout'> = (eventName, data) => {
 *   console.log(`${data.userId} logged out at ${data.timestamp}`);
 * };
 *
 * // Usage example in an event emitter
 * const [subscribe, emit, unsubscribeAll] = createEventEmitter<AppEvents>();
 *
 * // Subscribe to the 'userLogin' and 'userLogout' events
 * subscribe('userLogin', logUserLogin);
 * subscribe('userLogout', logUserLogout);
 *
 * // Emit the 'userLogin' event
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // This will trigger the 'logUserLogin' listener
 *
 * // Emit the 'userLogout' event
 * emit('userLogout', { userId: 'user1', timestamp: new Date() }); // This will trigger the 'logUserLogout' listener
 *
 * // Example output:
 * // user1 logged in at Sat Aug 28 2023 14:35:07 GMT+0000 (Coordinated Universal Time)
 * // user1 logged out at Sat Aug 28 2023 14:40:07 GMT+0000 (Coordinated Universal Time)
 */
export type EmitEvent<Event extends EventDescription<string, UnsafeAny>> = <EventType extends keyof Event & string>(
	eventName: EventType,
	data: Event[EventType]
) => void;

/**
 * Type for creating an event emitter, returning subscribe, emit, and unsubscribeAll functions.
 *
 * @returns A tuple containing the `subscribe`, `emit`, and `unsubscribeAll` functions.
 * @example
 * // Assume we have an event description type for application events
 * type AppEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;
 *
 * // Create the event emitter using the EventEmitterCreator type
 * const createAppEventEmitter: EventEmitterCreator = createEventEmitter;
 *
 * // Instantiate the event emitter for the AppEvents type
 * const [subscribe, emit, unsubscribeAll] = createAppEventEmitter<AppEvents>();
 *
 * // Example listener function for user login
 * const logUserLogin: EventListener<AppEvents, 'userLogin'> = (eventName, data) => {
 *   console.log(`${data.userId} logged in at ${data.timestamp}`);
 * };
 *
 * // Subscribe to the 'userLogin' event
 * subscribe('userLogin', logUserLogin);
 *
 * // Emit the 'userLogin' event
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // This will trigger the 'logUserLogin' listener
 *
 * // Unsubscribe all listeners for the 'userLogin' event
 * unsubscribeAll('userLogin');
 *
 * // Emit the 'userLogin' event again
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // No listener will be triggered, since we unsubscribed
 *
 * // Example output before unsubscribe:
 * // user1 logged in at Sat Aug 28 2023 14:35:07 GMT+0000 (Coordinated Universal Time)
 */
export type EventEmitterCreator = <Event extends EventDescription<string, UnsafeAny>>() => [
	subscribe: SubscribeEvent<Event>,
	emit: EmitEvent<Event>,
	unsubscribeAll: UnsubscribeAllEvents<Event>
];

/**
 * Structure representing a listener entry with an optional predicate.
 *
 * @template Event - The event description type.
 * @template EventType - The specific event type within the event description.
 */
type ListenersEntry<Event extends EventDescription<string, UnsafeAny>, EventType extends keyof Event & string> = {
	listener: EventListener<Event, EventType>;
	predicate?: EventPredicate<Event, EventType>;
};

/**
 * Structure representing an entry in the listeners map, with a current index and map of listeners.
 *
 * @template Event - The event description type.
 * @template EventType - The specific event type within the event description.
 */
type ListenersMapEntry<Event extends EventDescription<string, UnsafeAny>, EventType extends keyof Event & string> = {
	currentIndex: number;
	listeners: Map<number, ListenersEntry<Event, EventType>>;
};

/**
 * Class encapsulating a map to manage event listeners and associated data.
 *
 * @template Event - The event description type.
 */
class EventsMap<Event extends EventDescription<string, UnsafeAny>> {
	// Internal map storing event types and their corresponding listeners
	private map = new Map<keyof Event & string, ListenersMapEntry<Event, keyof Event & string>>();

	/**
	 * Sets a new entry in the map for a specific event type.
	 *
	 * @template K - The specific event key.
	 * @param key - The event key.
	 * @param value - The value to set for the event key.
	 * @returns The current instance for chaining.
	 */
	set<K extends keyof Event & string>(key: K, value: ListenersMapEntry<Event, K>): this {
		this.map.set(key, <ListenersMapEntry<Event, keyof Event & string>>value);
		return this;
	}

	/**
	 * Retrieves the entry from the map for a specific event type.
	 *
	 * @template K - The specific event key.
	 * @param key - The event key.
	 * @returns The entry associated with the event key, or undefined if not found.
	 */
	get<K extends keyof Event & string>(key: K): ListenersMapEntry<Event, K> | undefined {
		return this.map.get(key);
	}

	/**
	 * Checks if a specific event type exists in the map.
	 *
	 * @template K - The specific event key.
	 * @param key - The event key.
	 * @returns A boolean indicating whether the event key exists in the map.
	 */
	has<K extends keyof Event & string>(key: K): boolean {
		return this.map.has(key);
	}

	/**
	 * Deletes a specific event type from the map.
	 *
	 * @template K - The specific event key.
	 * @param key - The event key.
	 * @returns A boolean indicating whether the deletion was successful.
	 */
	delete<K extends keyof Event & string>(key: K): boolean {
		return this.map.delete(key);
	}

	/**
	 * Clears all entries from the map.
	 */
	clear(): void {
		this.map.clear();
	}

	/**
	 * Returns the number of event types stored in the map.
	 *
	 * @returns The size of the map.
	 */
	get size(): number {
		return this.map.size;
	}
}

/**
 * Utility function to resolve or create a new event store.
 *
 * @template Event - The event description type.
 * @param eventsStore - The existing event store, if any.
 * @returns The resolved or newly created event store.
 */
const resolveEventsStore = <Event extends EventDescription<string, UnsafeAny>>(
	eventsStore?: EventsMap<Event>
): EventsMap<Event> => {
	if (eventsStore) {
		return eventsStore;
	}
	return new EventsMap();
};

/**
 * Utility function to resolve listeners for a specific event, initializing if necessary.
 *
 * @template Event - The event description type.
 * @template EventType - The specific event type within the event description.
 * @param eventsStore - The event store containing listeners.
 * @param eventName - The name of the event to resolve listeners for.
 * @returns The resolved listeners map entry for the specified event type.
 */
const resolveEventListeners = <
	Event extends EventDescription<string, UnsafeAny>,
	EventType extends keyof Event & string
>(
	eventsStore: EventsMap<Event>,
	eventName: EventType
): ListenersMapEntry<Event, EventType> => {
	if (!eventsStore.has(eventName)) {
		return {
			currentIndex: 0,
			listeners: new Map()
		};
	}
	return eventsStore.get(eventName)!;
};

/**
 * Creates an event emitter, providing subscribe, emit, and unsubscribeAll functions.
 *
 * @template Event - The event description type.
 * @returns An array containing the subscribe, emit, and unsubscribeAll functions.
 * @example
 * // Define an event description type for application events
 * type AppEvents = EventDescription<'userLogin' | 'userLogout', { userId: string; timestamp: Date }>;
 *
 * // Create an event emitter for the AppEvents type
 * const [subscribe, emit, unsubscribeAll] = createEventEmitter<AppEvents>();
 *
 * // Example listener function for the 'userLogin' event
 * const logUserLogin: EventListener<AppEvents, 'userLogin'> = (eventName, data) => {
 *   console.log(`${data.userId} logged in at ${data.timestamp}`);
 * };
 *
 * // Subscribe to the 'userLogin' event
 * subscribe('userLogin', logUserLogin);
 *
 * // Emit the 'userLogin' event
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // This will trigger the 'logUserLogin' listener
 *
 * // Example listener function for the 'userLogout' event
 * const logUserLogout: EventListener<AppEvents, 'userLogout'> = (eventName, data) => {
 *   console.log(`${data.userId} logged out at ${data.timestamp}`);
 * };
 *
 * // Subscribe to the 'userLogout' event
 * subscribe('userLogout', logUserLogout);
 *
 * // Emit the 'userLogout' event
 * emit('userLogout', { userId: 'user1', timestamp: new Date() }); // This will trigger the 'logUserLogout' listener
 *
 * // Unsubscribe all listeners for the 'userLogin' event
 * unsubscribeAll('userLogin');
 *
 * // Emit the 'userLogin' event again
 * emit('userLogin', { userId: 'user1', timestamp: new Date() }); // No listener will be triggered, since we unsubscribed
 *
 * // Unsubscribe all listeners for all events
 * unsubscribeAll();
 *
 * // Emit the 'userLogout' event again
 * emit('userLogout', { userId: 'user1', timestamp: new Date() }); // No listener will be triggered, since all listeners were unsubscribed
 *
 * // Example output before unsubscribe:
 * // user1 logged in at Sat Aug 28 2023 14:35:07 GMT+0000 (Coordinated Universal Time)
 * // user1 logged out at Sat Aug 28 2023 14:40:07 GMT+0000 (Coordinated Universal Time)
 */
export const createEventEmitter: EventEmitterCreator = <Event extends EventDescription<string, UnsafeAny>>() => {
	let eventsStore: EventsMap<Event> | undefined;

	// Subscribe to a specific event, adding a listener with an optional predicate
	const subscribe: SubscribeEvent<Event> = <EventType extends keyof Event & string>(
		eventName: EventType,
		listener: EventListener<Event, EventType>,
		predicate?: EventPredicate<Event, EventType>
	) => {
		const resolvedEventsStore = resolveEventsStore(eventsStore);
		const listenersMapEntry = resolveEventListeners(resolvedEventsStore, eventName);
		const index = listenersMapEntry.currentIndex;
		listenersMapEntry.currentIndex = index + 1;
		listenersMapEntry.listeners.set(
			index,
			predicate
				? {
						listener,
						predicate
					}
				: { listener }
		);
		eventsStore = resolvedEventsStore.set(eventName, listenersMapEntry);

		// Return a function to unsubscribe the listener
		return (): boolean => {
			if (!eventsStore) {
				return false;
			}
			const eventTypeEntry = eventsStore.get(eventName);
			if (!eventTypeEntry) {
				return false;
			}
			const hasDeleted = eventTypeEntry.listeners.delete(index);
			if (eventTypeEntry.listeners.size === 0) {
				eventsStore.delete(eventName);
			}
			if (eventsStore.size === 0) {
				eventsStore = undefined;
			}
			return hasDeleted;
		};
	};

	// Emit an event, triggering all listeners registered for this event type
	const emit: EmitEvent<Event> = <EventType extends keyof Event & string>(
		eventName: EventType,
		data: Event[EventType]
	) => {
		if (!eventsStore) {
			return;
		}
		const listenersMapEntry = eventsStore.get(eventName);
		if (!listenersMapEntry) {
			return;
		}
		listenersMapEntry.listeners.forEach(({ listener, predicate }) => {
			if (predicate && !predicate(data)) {
				return;
			}
			listener(eventName, data);
		});
	};

	// Unsubscribe all listeners for a specific event or all events
	const unsubscribeAll: UnsubscribeAllEvents<Event> = <EventType extends keyof Event & string>(
		eventName?: EventType
	) => {
		if (!eventsStore) {
			return;
		}
		if (!eventName) {
			eventsStore.clear();
			eventsStore = undefined;
			return;
		}
		eventsStore.delete(eventName);
		if (eventsStore.size === 0) {
			eventsStore = undefined;
		}
	};

	// Return the functions to subscribe, emit, and unsubscribe all listeners
	return [subscribe, emit, unsubscribeAll];
};

/**
 * Type for subscribing to an event only once. The listener will automatically unsubscribe after the event is triggered.
 *
 * @template Event - The event description type.
 *
 * @example
 * // Define event descriptions
 * type MyEvents = EventDescription<'userConnected', { userId: string; timestamp: Date }>;
 *
 * // Create an event emitter
 * const [subscribe, emit] = createEventEmitter<MyEvents>();
 *
 * // Use the `once` utility to subscribe to the `userConnected` event
 * const onceSubscribe = once(subscribe);
 *
 * onceSubscribe('userConnected', (eventName, data) => {
 *   console.log(`User ${data.userId} connected at ${data.timestamp}`);
 * });
 *
 * // Emit the `userConnected` event
 * emit('userConnected', { userId: 'user123', timestamp: new Date() });
 */
export type SubscribeOnce<Event extends EventDescription<string, UnsafeAny>> = <EventType extends keyof Event & string>(
	eventName: EventType,
	listener: EventListener<Event, EventType>
) => void;

/**
 * Utility function to subscribe to an event only once. It automatically unsubscribes after the event is triggered.
 *
 * @template Event - The event description type.
 * @param subscribe - The original `subscribe` function to wrap with the `once` functionality.
 * @returns A function that subscribes to an event once and unsubscribes automatically after the event is triggered.
 */
export const once =
	<Event extends EventDescription<string, UnsafeAny>>(subscribe: SubscribeEvent<Event>): SubscribeOnce<Event> =>
	<EventType extends keyof Event & string>(eventName: EventType, listener: EventListener<Event, EventType>) => {
		const unsubscribe = subscribe(eventName, (eventName, data) => {
			unsubscribe();
			listener(eventName, data);
		});
	};

/**
 * Type for subscribing to an event and returning a promise that resolves when the event is triggered.
 *
 * @template Event - The event description type.
 *
 * @example
 * // Define event descriptions
 * type MyEvents = EventDescription<'userConnected', { userId: string; timestamp: Date }>;
 *
 * // Create an event emitter
 * const [subscribe, emit] = createEventEmitter<MyEvents>();
 *
 * // Use the `awaited` utility to subscribe to the `userConnected` event and return a promise
 * const awaitedSubscribe = awaited(subscribe);
 *
 * awaitedSubscribe('userConnected').then((data) => {
 *   console.log(`User ${data.userId} connected at ${data.timestamp}`);
 * });
 *
 * // Emit the `userConnected` event
 * emit('userConnected', { userId: 'user123', timestamp: new Date() });
 */
export type SubscribeAwaited<Event extends EventDescription<string, UnsafeAny>> = <
	EventType extends keyof Event & string
>(
	eventName: EventType
) => Promise<Event[EventType]>;

/**
 * Utility function to subscribe to an event and return a promise that resolves when the event is triggered.
 * It automatically unsubscribes after the event is handled.
 *
 * @template Event - The event description type.
 * @param subscribe - The original `subscribe` function to wrap with the `awaited` functionality.
 * @returns A function that subscribes to an event and returns a promise that resolves with the event data.
 */
export const awaited =
	<Event extends EventDescription<string, UnsafeAny>>(subscribe: SubscribeEvent<Event>): SubscribeAwaited<Event> =>
	<EventType extends keyof Event & string>(eventName: EventType) =>
		new Promise<Event[EventType]>(resolve => {
			const unsubscribe = subscribe(eventName, (_, data) => {
				unsubscribe();
				resolve(data);
			});
		});
