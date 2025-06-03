import {
	awaited,
	createEventEmitter,
	emitter,
	once,
	subscriber,
	type EmitEvent,
	type EventDescription,
	type SubscribeEvent,
	type UnsubscribeAllEvents
} from "../src/eventEmitter";

describe("eventEmitter", () => {
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

		it("handles unsubscription of one listener by another during emission", () => {
			const logUserLogin1 = jest.fn();
			const logUserLogin2 = jest.fn();

			// eslint-disable-next-line prefer-const
			let unsubscribeSecond!: ReturnType<typeof subscribe>;

			subscribe("userLogin", (eventName, data) => {
				logUserLogin1(eventName, data);
				unsubscribeSecond();
			});

			unsubscribeSecond = subscribe("userLogin", logUserLogin2);

			// First emission: both listeners should be called once
			emit("userLogin", { userId: "user1", timestamp: new Date() });

			expect(logUserLogin1).toHaveBeenCalledTimes(1);
			expect(logUserLogin2).toHaveBeenCalledTimes(1);

			// Second emission: only the first listener should fire
			emit("userLogin", { userId: "user1", timestamp: new Date() });

			expect(logUserLogin1).toHaveBeenCalledTimes(2);
			expect(logUserLogin2).toHaveBeenCalledTimes(1);
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
	});

	describe("once helper", () => {
		type AppEvents = EventDescription<"userLogin" | "userLogout", { userId: string; timestamp: Date }>;

		let subscribe: SubscribeEvent<AppEvents>;
		let emit: EmitEvent<AppEvents>;
		let onceSubscribe: ReturnType<typeof once<AppEvents>>;

		beforeEach(() => {
			[subscribe, emit] = createEventEmitter<AppEvents>();
			onceSubscribe = once(subscribe);
		});

		it("should trigger the listener only once", () => {
			const logUserLogin = jest.fn();
			onceSubscribe("userLogin", logUserLogin);

			emit("userLogin", { userId: "user1", timestamp: new Date() });
			emit("userLogin", { userId: "user1", timestamp: new Date() });

			expect(logUserLogin).toHaveBeenCalledTimes(1);
		});

		it("should unsubscribe after the first event", () => {
			const logUserLogin = jest.fn();
			onceSubscribe("userLogin", logUserLogin);

			emit("userLogin", { userId: "user1", timestamp: new Date() });
			emit("userLogin", { userId: "user1", timestamp: new Date() });

			expect(logUserLogin).toHaveBeenCalledTimes(1);
			expect(logUserLogin).toHaveBeenCalledWith("userLogin", { userId: "user1", timestamp: expect.any(Date) });
		});

		it("should handle multiple once subscriptions independently", () => {
			const logUserLogin1 = jest.fn();
			const logUserLogin2 = jest.fn();
			onceSubscribe("userLogin", logUserLogin1);
			onceSubscribe("userLogin", logUserLogin2);

			emit("userLogin", { userId: "user1", timestamp: new Date() });
			emit("userLogin", { userId: "user1", timestamp: new Date() });

			expect(logUserLogin1).toHaveBeenCalledTimes(1);
			expect(logUserLogin2).toHaveBeenCalledTimes(1);
		});
	});

	describe("awaited helper", () => {
		type AppEvents = EventDescription<"userLogin" | "userLogout", { userId: string; timestamp: Date }>;

		let subscribe: SubscribeEvent<AppEvents>;
		let emit: EmitEvent<AppEvents>;
		let awaitedSubscribe: ReturnType<typeof awaited<AppEvents>>;

		beforeEach(() => {
			[subscribe, emit] = createEventEmitter<AppEvents>();
			awaitedSubscribe = awaited(subscribe);
		});

		it("should resolve the promise with event data", async () => {
			const loginPromise = awaitedSubscribe("userLogin");

			emit("userLogin", { userId: "user1", timestamp: new Date() });

			const result = await loginPromise;

			expect(result).toEqual({ userId: "user1", timestamp: expect.any(Date) });
		});

		it("should not resolve if the event does not occur", async () => {
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

		it("should handle multiple awaited subscriptions independently", async () => {
			const loginPromise1 = awaitedSubscribe("userLogin");
			const loginPromise2 = awaitedSubscribe("userLogin");

			emit("userLogin", { userId: "user1", timestamp: new Date() });

			const [result1, result2] = await Promise.all([loginPromise1, loginPromise2]);

			expect(result1).toEqual({ userId: "user1", timestamp: expect.any(Date) });
			expect(result2).toEqual({ userId: "user1", timestamp: expect.any(Date) });
		});
	});

	describe("subscriber helper", () => {
		type AppEvents = EventDescription<"userLogin" | "userLogout", { userId: string; timestamp: Date }>;

		let subscribe: SubscribeEvent<AppEvents>;
		let emit: EmitEvent<AppEvents>;
		let createSubscriber: ReturnType<typeof subscriber<AppEvents>>;
		beforeEach(() => {
			[subscribe, emit] = createEventEmitter<AppEvents>();
			createSubscriber = subscriber(subscribe);
		});

		it("creates specialized subscription functions", () => {
			const onUserLogin = createSubscriber("userLogin");
			const onUserLogout = createSubscriber("userLogout");

			const logUserLogin = jest.fn();
			const logUserLogout = jest.fn();

			onUserLogin(logUserLogin);
			onUserLogout(logUserLogout);

			emit("userLogin", { userId: "user1", timestamp: new Date() });
			emit("userLogout", { userId: "user1", timestamp: new Date() });

			expect(logUserLogin).toHaveBeenCalledWith({ userId: "user1", timestamp: expect.any(Date) });
			expect(logUserLogout).toHaveBeenCalledWith({ userId: "user1", timestamp: expect.any(Date) });
		});

		it("handles predicates correctly", () => {
			const onUserLogin = createSubscriber("userLogin");
			const logUserLogin = jest.fn();
			const predicate = (data: { userId: string; timestamp: Date }): boolean => data.userId === "specificUserId";

			onUserLogin(logUserLogin, predicate);

			emit("userLogin", { userId: "specificUserId", timestamp: new Date() });
			emit("userLogin", { userId: "anotherUserId", timestamp: new Date() });

			expect(logUserLogin).toHaveBeenCalledTimes(1);
			expect(logUserLogin).toHaveBeenCalledWith({ userId: "specificUserId", timestamp: expect.any(Date) });
		});

		it("returns unsubscribe function", () => {
			const onUserLogin = createSubscriber("userLogin");
			const logUserLogin = jest.fn();

			const unsubscribe = onUserLogin(logUserLogin);
			emit("userLogin", { userId: "user1", timestamp: new Date() });
			expect(logUserLogin).toHaveBeenCalledTimes(1);

			unsubscribe();
			emit("userLogin", { userId: "user1", timestamp: new Date() });
			expect(logUserLogin).toHaveBeenCalledTimes(1);
		});

		it("handles complex event types with intersection", () => {
			type ComplexEvents = EventDescription<"userConnected", { userId: string; timestamp: Date }> &
				EventDescription<
					"userDisconnected",
					{ userId: string; timestamp: Date; reason: "timeout" | "manual" | "error" }
				> &
				EventDescription<"userMessage", { userId: string; message: string; priority: "low" | "high" }>;

			const [subscribe, emit] = createEventEmitter<ComplexEvents>();
			const createSubscriber = subscriber(subscribe);

			const onUserConnected = createSubscriber("userConnected");
			const onUserDisconnected = createSubscriber("userDisconnected");
			const onUserMessage = createSubscriber("userMessage");

			const logUserConnected = jest.fn();
			const logUserDisconnected = jest.fn();
			const logUserMessage = jest.fn();

			onUserConnected(logUserConnected);
			onUserDisconnected(logUserDisconnected);
			onUserMessage(logUserMessage);

			emit("userConnected", { userId: "user1", timestamp: new Date() });
			emit("userDisconnected", { userId: "user1", timestamp: new Date(), reason: "timeout" });
			emit("userMessage", { userId: "user1", message: "Hello", priority: "high" });

			expect(logUserConnected).toHaveBeenCalledWith({ userId: "user1", timestamp: expect.any(Date) });
			expect(logUserDisconnected).toHaveBeenCalledWith({
				userId: "user1",
				timestamp: expect.any(Date),
				reason: "timeout"
			});
			expect(logUserMessage).toHaveBeenCalledWith({
				userId: "user1",
				message: "Hello",
				priority: "high"
			});

			// @ts-expect-error - should not accept wrong event type
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const onWrongEvent = createSubscriber("wrongEvent");
			// @ts-expect-error - should not accept wrong data type for userDisconnected
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			onUserDisconnected((data: { userId: string; timestamp: Date }) => {});
			// @ts-expect-error - should not accept wrong reason value
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			onUserDisconnected((data: { userId: string; timestamp: Date; reason: "invalid" }) => {});
			// @ts-expect-error - should not accept wrong priority value
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			onUserMessage((data: { userId: string; message: string; priority: "medium" }) => {});
		});
	});

	describe("emitter helper", () => {
		type AppEvents = EventDescription<"userLogin" | "userLogout", { userId: string; timestamp: Date }>;

		let subscribe: SubscribeEvent<AppEvents>;
		let emit: EmitEvent<AppEvents>;
		let createEmitter: ReturnType<typeof emitter<AppEvents>>;
		beforeEach(() => {
			[subscribe, emit] = createEventEmitter<AppEvents>();
			createEmitter = emitter(emit);
		});

		it("creates specialized emit functions", () => {
			const emitUserLogin = createEmitter("userLogin");
			const emitUserLogout = createEmitter("userLogout");

			const logUserLogin = jest.fn();
			const logUserLogout = jest.fn();

			subscribe("userLogin", (_, data) => logUserLogin(data));
			subscribe("userLogout", (_, data) => logUserLogout(data));

			emitUserLogin({ userId: "user1", timestamp: new Date() });
			emitUserLogout({ userId: "user1", timestamp: new Date() });

			expect(logUserLogin).toHaveBeenCalledWith({ userId: "user1", timestamp: expect.any(Date) });
			expect(logUserLogout).toHaveBeenCalledWith({ userId: "user1", timestamp: expect.any(Date) });
		});

		it("maintains type safety", () => {
			const emitUserLogin = createEmitter("userLogin");

			// @ts-expect-error - should not accept wrong data type
			emitUserLogin({ text: "wrong" });

			// @ts-expect-error - should not accept wrong event type
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const emitWrongEvent = createEmitter("wrongEvent");
			expect(true).toBe(true);
		});

		it("handles complex event types with intersection", () => {
			type ComplexEvents = EventDescription<"userConnected", { userId: string; timestamp: Date }> &
				EventDescription<
					"userDisconnected",
					{ userId: string; timestamp: Date; reason: "timeout" | "manual" | "error" }
				> &
				EventDescription<"userMessage", { userId: string; message: string; priority: "low" | "high" }>;

			const [subscribe, emit] = createEventEmitter<ComplexEvents>();
			const createEmitter = emitter(emit);

			const emitUserConnected = createEmitter("userConnected");
			const emitUserDisconnected = createEmitter("userDisconnected");
			const emitUserMessage = createEmitter("userMessage");

			const logUserConnected = jest.fn();
			const logUserDisconnected = jest.fn();
			const logUserMessage = jest.fn();

			subscribe("userConnected", (_, data) => logUserConnected(data));
			subscribe("userDisconnected", (_, data) => logUserDisconnected(data));
			subscribe("userMessage", (_, data) => logUserMessage(data));

			emitUserConnected({ userId: "user1", timestamp: new Date() });
			emitUserDisconnected({ userId: "user1", timestamp: new Date(), reason: "timeout" });
			emitUserMessage({ userId: "user1", message: "Hello", priority: "high" });

			expect(logUserConnected).toHaveBeenCalledWith({ userId: "user1", timestamp: expect.any(Date) });
			expect(logUserDisconnected).toHaveBeenCalledWith({
				userId: "user1",
				timestamp: expect.any(Date),
				reason: "timeout"
			});
			expect(logUserMessage).toHaveBeenCalledWith({
				userId: "user1",
				message: "Hello",
				priority: "high"
			});

			// @ts-expect-error - should not accept wrong event type
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const emitWrongEvent = createEmitter("wrongEvent");
			// @ts-expect-error - should not accept wrong data type for userDisconnected
			emitUserDisconnected({ userId: "user1", timestamp: new Date() });
			// @ts-expect-error - should not accept wrong reason value
			emitUserDisconnected({ userId: "user1", timestamp: new Date(), reason: "invalid" });
			// @ts-expect-error - should not accept wrong priority value
			emitUserMessage({ userId: "user1", message: "Hello", priority: "medium" });
		});
	});
});
