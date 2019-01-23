import { descriptor } from "./decorators";
import { AnyDict } from "./any-dict";
import { Lazy } from "./lazy";

export type BasicEventHandler<T, E> = (sender?: T, args?: E) => void;

export class SubscriptionCancellationToken
{
	private _isCancelled = false;
	public get isCancelled() { return this._isCancelled; }

	cancelFunction: (() => void) | null;

	cancel()
	{
		if (this.isCancelled == true)
			return;

		if (this.cancelFunction)
			this.cancelFunction();

		this.cancelFunction = null;
		this._isCancelled = true;
	}

	constructor(cancelFunction: () => void)
	{
		this.cancelFunction = cancelFunction;
	}
}

export class BasicEvent<T, E>
{
	@descriptor({ instance: true, enumerable: false, writable: true })
	private handlers: BasicEventHandler<T, E>[] = [];

	/** Adds handler to the event. Returns cancellation token. */
	on(handler: BasicEventHandler<T, E>): SubscriptionCancellationToken
	{
		this.handlers.push(handler);

		return new SubscriptionCancellationToken(() => this.off(handler));
	}
	/** Removes handler from the event. */
	off(handler: BasicEventHandler<T, E>): void
	{
		var index = this.handlers.indexOf(handler);
		if (index != -1)
			this.handlers.splice(index, 1);
	}
	/** Subscribes only once. Return canellation token, which is the only way to unsubscribe, as the handler is wrapped. */
	once(handler: BasicEventHandler<T, E>): SubscriptionCancellationToken
	{
		var wrap = (s: T | undefined, e: E | undefined) =>
		{
			handler(s, e);

			this.off(wrap);
		}
		this.on(wrap);

		return new SubscriptionCancellationToken(() => this.off(wrap));
	}
	/** Trigger the event. */
	trigger(args?: E)
	{
		this.handlers.forEach(h => h(this.sender, args));
	}

	@descriptor({ instance: true, enumerable: false, writable: true })
	private sender: T | undefined;

	constructor(
		sender?: T
	)
	{
		this.sender = sender;
	}
}

type EventHandlerObject<T extends Event> = { handleEvent: (e: T) => void };
type EventHandler<T extends Event> = ((e: T) => void);
type GenericEventHandler<T extends Event> = EventHandler<T> | EventHandlerObject<T>;

export class EventUtility
{
	static _supportsOnce = new Lazy(() =>
	{
		var element = document.createElement("div");
		var counter = 0;
		element.addEventListener("test", () => counter++, <any>{ once: true });
		var makeEvent = () =>
		{
			var event = document.createEvent("CustomEvent");
			event.initCustomEvent("test", false, false, null);
			return event;
		};
		element.dispatchEvent(makeEvent());
		element.dispatchEvent(makeEvent());
		return counter == 1;
	});
	static get supportsOnce()
	{
		return this._supportsOnce.value;
	}

	private static getRemoveOptions(options: { capture?: boolean })
	{
		return typeof options === 'boolean' ? options : ('capture' in options ? options.capture : void 0);
	}

	static handle<T extends Event>(listenerArg: GenericEventHandler<T>, event: T)
	{
		if (typeof (<AnyDict>listenerArg)['handleEvent'] === 'function')
			(<EventHandlerObject<T>>listenerArg).handleEvent(event);
		else
			(<EventHandler<T>>listenerArg)(event);
	};
	static cancelable<T extends Event>(target: EventTarget, type: string, listener: GenericEventHandler<T>, options: any = false)
	{
		target.addEventListener(type, <EventListener>listener, options);
		return new SubscriptionCancellationToken(() => target.removeEventListener(type, <EventListener>listener, EventUtility.getRemoveOptions(options)));
	};
	static throttled<T extends Event>(target: EventTarget, type: string, listener: GenericEventHandler<T>)
	{
		var customType = type + "Throttled";
		var running = false;
		var func = (e: Event) =>
		{
			if (running)
				return;

			running = true;
			window.requestAnimationFrame(() =>
			{
				var event = document.createEvent("CustomEvent");
				event.initCustomEvent(customType, false, false, e);
				target.dispatchEvent(event);
				running = false;
			});
		};
		var internalCancel = this.cancelable(target, type, func);
		var mainCancel = this.cancelable(target, customType, (e: CustomEvent) => this.handle(listener, e.detail));
		return new SubscriptionCancellationToken(() =>
		{
			internalCancel.cancel();
			mainCancel.cancel();
		});
	};
	static once<T extends Event>(target: EventTarget, type: string, listener: EventHandler<T>, options: any = false)
	{
		if (this.supportsOnce)
		{
			if (typeof options == "boolean")
				options = { capture: options, once: true, passive: false };
			else
				options.once = true;

			return this.cancelable(target, type, listener, options);
		}
		else
		{
			var handler: EventHandler<T> = (e: Event) =>
			{
				listener(<T>e);
				target.removeEventListener(type, <EventListener>handler, this.getRemoveOptions(options));
			};

			return this.cancelable(target, type, handler, options);
		}
	};
}