import {
	awaited,
	createEventEmitter,
	once,
	type EmitEvent,
	type EventDescription,
	type SubscribeEvent,
	type UnsubscribeAllEvents
} from "../src/eventEmitter.js";

describe("createEventEmitter", () => {
	type AppEvents = EventDescription<"userLogin" | "userLogout", { userId: string; timestamp: Date }>;

	let subscribe: SubscribeEvent<AppEvents>;
	let emit: EmitEvent<AppEvents>;
	let unsubscribeAll: UnsubscribeAllEvents<AppEvents>;

	beforeEach(() => {
		[subscribe, emit, unsubscribeAll] = createEventEmitter<AppEvents>();
	});

	it("should trigger the listener when an event is emitted", () => {
		const logUserLogin = jest.fn();
		subscribe("userLogin", logUserLogin);

		emit("userLogin", { userId: "user1", timestamp: new Date() });

		expect(logUserLogin).toHaveBeenCalledWith("userLogin", { userId: "user1", timestamp: expect.any(Date) });
	});

	it("should not trigger the listener after it has been unsubscribed", () => {
		const logUserLogin = jest.fn();
		const unsubscribe = subscribe("userLogin", logUserLogin);

		unsubscribe();

		emit("userLogin", { userId: "user1", timestamp: new Date() });

		expect(logUserLogin).not.toHaveBeenCalled();
	});

	it("should trigger the listener only if the predicate returns true", () => {
		const logUserLogin = jest.fn();
		const predicate = jest.fn(data => data.userId === "specificUserId");
		subscribe("userLogin", logUserLogin, predicate);

		emit("userLogin", { userId: "specificUserId", timestamp: new Date() });
		emit("userLogin", { userId: "anotherUserId", timestamp: new Date() });

		expect(logUserLogin).toHaveBeenCalledTimes(1);
		expect(predicate).toHaveBeenCalledTimes(2);
		expect(logUserLogin).toHaveBeenCalledWith("userLogin", {
			userId: "specificUserId",
			timestamp: expect.any(Date)
		});
	});

	it("should unsubscribe all listeners for a specific event", () => {
		const logUserLogin = jest.fn();
		const logUserLogin2 = jest.fn();
		subscribe("userLogin", logUserLogin);
		subscribe("userLogin", logUserLogin2);

		unsubscribeAll("userLogin");

		emit("userLogin", { userId: "user1", timestamp: new Date() });

		expect(logUserLogin).not.toHaveBeenCalled();
		expect(logUserLogin2).not.toHaveBeenCalled();
	});

	it("should unsubscribe all listeners for all events", () => {
		const logUserLogin = jest.fn();
		const logUserLogout = jest.fn();
		subscribe("userLogin", logUserLogin);
		subscribe("userLogout", logUserLogout);

		unsubscribeAll();

		emit("userLogin", { userId: "user1", timestamp: new Date() });
		emit("userLogout", { userId: "user1", timestamp: new Date() });

		expect(logUserLogin).not.toHaveBeenCalled();
		expect(logUserLogout).not.toHaveBeenCalled();
	});

	it("should allow multiple listeners for the same event", () => {
		const logUserLogin = jest.fn();
		const logUserLogin2 = jest.fn();
		subscribe("userLogin", logUserLogin);
		subscribe("userLogin", logUserLogin2);

		emit("userLogin", { userId: "user1", timestamp: new Date() });

		expect(logUserLogin).toHaveBeenCalled();
		expect(logUserLogin2).toHaveBeenCalled();
	});

	it("should not throw if emit is called without any listeners", () => {
		expect(() => {
			emit("userLogin", { userId: "user1", timestamp: new Date() });
		}).not.toThrow();
	});

	it("should return false if unsubscribe is called more than once", () => {
		const logUserLogin = jest.fn();
		const unsubscribe = subscribe("userLogin", logUserLogin);

		// First call to unsubscribe should return true
		const firstUnsubscribeResult = unsubscribe();
		expect(firstUnsubscribeResult).toBe(true);

		// Second call to unsubscribe should return false
		const secondUnsubscribeResult = unsubscribe();
		expect(secondUnsubscribeResult).toBe(false);

		// Emit should not trigger the listener
		emit("userLogin", { userId: "user1", timestamp: new Date() });
		expect(logUserLogin).not.toHaveBeenCalled();
	});

	it("should allow unsubscribing one event while keeping another event intact", () => {
		const logUserLogin = jest.fn();
		const logUserLogout = jest.fn();

		const unsubscribeLogin = subscribe("userLogin", logUserLogin);
		subscribe("userLogout", logUserLogout);

		// Unsubscribe from 'userLogin' event
		unsubscribeLogin();

		// Emit events
		emit("userLogin", { userId: "user1", timestamp: new Date() });
		emit("userLogout", { userId: "user1", timestamp: new Date() });

		// 'userLogin' should not trigger any listener
		expect(logUserLogin).not.toHaveBeenCalled();

		// 'userLogout' should still trigger its listener
		expect(logUserLogout).toHaveBeenCalledWith("userLogout", { userId: "user1", timestamp: expect.any(Date) });

		// Unsubscribe 'userLogin' again should return false
		expect(unsubscribeLogin()).toBe(false);
	});

	it("should not throw or cause issues when unsubscribeAll is called without any subscriptions", () => {
		expect(() => {
			unsubscribeAll(); // No subscriptions should exist at this point
		}).not.toThrow();

		// Emit events to ensure nothing is triggered
		expect(() => {
			emit("userLogin", { userId: "user1", timestamp: new Date() });
			emit("userLogout", { userId: "user1", timestamp: new Date() });
		}).not.toThrow();
	});
	it("should trigger the listener only once using `once`", () => {
		const logUserLogin = jest.fn();
		const onceSubscribe = once(subscribe);

		onceSubscribe("userLogin", logUserLogin);

		emit("userLogin", { userId: "user1", timestamp: new Date() });
		emit("userLogin", { userId: "user1", timestamp: new Date() });

		expect(logUserLogin).toHaveBeenCalledTimes(1);
	});
	it("should resolve the promise with event data using `awaited`", async () => {
		const awaitedSubscribe = awaited(subscribe);

		const loginPromise = awaitedSubscribe("userLogin");

		emit("userLogin", { userId: "user1", timestamp: new Date() });

		const result = await loginPromise;

		expect(result).toEqual({ userId: "user1", timestamp: expect.any(Date) });
	});

	it("should not resolve the `awaited` promise if the event does not occur", async () => {
		const awaitedSubscribe = awaited(subscribe);

		const loginPromise = awaitedSubscribe("userLogin");

		// Emit a different event
		emit("userLogout", { userId: "user1", timestamp: new Date() });

		// Ensure the promise is still pending by using a timeout
		const isStillPending = await Promise.race([
			loginPromise.then(() => false),
			new Promise<boolean>(resolve => setTimeout(() => resolve(true), 100))
		]);

		expect(isStillPending).toBe(true);
	});
});
