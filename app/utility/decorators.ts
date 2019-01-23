import angular from 'angular';
import { AnyDict } from "./any-dict";

export interface IDescriptorOptions
{
	/** Special flag to change instance descriptor upon first assignment. Default is false.  */
	instance?: boolean;

	configurable?: boolean;
	enumerable?: boolean;
	value?: any;
	writable?: boolean;
	get?: (this: any) => any;
	set?: (this: any, value: any) => void;
}

/**
 * Decorator that sets the descriptor properties of a class field.
 */
export function descriptor(options: IDescriptorOptions)
{
	return (target: any, propertyKey: string, descriptor?: PropertyDescriptor): any =>
	{
		var modifyDescriptor = (d: PropertyDescriptor | undefined) =>
		{
			d = d || {};

			// Defaults
			if (d.configurable == null) d.configurable = true;
			if (d.enumerable == null) d.enumerable = true;

			// Update
			if (options.configurable != null) d.configurable = options.configurable;
			if (options.enumerable != null) d.enumerable = options.enumerable;
			if (options.writable != null) d.writable = options.writable;
			if (options.value != null) d.value = options.value;
			if (options.get != null) d.get = options.get;
			if (options.set != null) d.set = options.set;

			return d;
		}


		if (options.instance == true)
		{
			Object.defineProperty(target, propertyKey, {
				configurable: true,
				set: function (this: any, value)
				{
					var descriptor = Object.getOwnPropertyDescriptor(this, propertyKey);
					descriptor = modifyDescriptor(descriptor);
					Object.defineProperty(this, propertyKey, descriptor);

					this[propertyKey] = value;
				}
			});
		}
		else
		{
			Object.defineProperty(target, propertyKey, modifyDescriptor(descriptor));
		}
	};
}


const serialized = new WeakMap();

/** Set on a class to automatically generate a "toJSON" function from all the fields/properties annotated with "serialize". */
export function serializable()
{
	return (target: any) =>
	{
		target.prototype.toJSON = function (this: any)
		{
			const map = serialized.get(target.prototype);
			const props = Object.keys(map);
			return props.reduce((previous: AnyDict, key) =>
			{
				previous[map[key]] = this[key];
				return previous;
			}, {});
		}
	}
}

/** Indicates that a property or field should be serialized. */
export function serialize(name?: string)
{
	return (target: any, propertyKey: string) =>
	{
		let map = serialized.get(target);
		if (!map)
		{
			map = {};
			serialized.set(target, map);
		}

		map[propertyKey] = name || propertyKey;
	}
}

/**
 * Caches the result of a getter call and only updates the value of the dependency function changes.
 * The dependency function can return dictionaries or arrays of dependencies. The results are compared using angular.equals.
 * If no dependency is provided the value is calculated only once.
 */
export function cachedGetter<T>(dependency?: (instance: T) => any)
{
	return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) =>
	{
		var cacheKey = "_cached_" + propertyKey;
		var dependencyCacheKey = "_cached_dp_" + propertyKey;

		var cfgProp = descriptor({
			instance: true,
			writable: true,
			enumerable: false
		});
		cfgProp(target, cacheKey);
		cfgProp(target, dependencyCacheKey);

		var originalGet = propertyDescriptor.get;

		return <PropertyDescriptor>{
			get: function (this: any)
			{
				if (originalGet == null)
					throw new Error("Cached getter cannot be used on property without getter.");

				if (dependency == null)
					dependency = (_instance: T) => true;

				var dp = dependency(this);
				if (this[cacheKey] == null || angular.equals(this[dependencyCacheKey], dp) == false)
				{
					this[cacheKey] = originalGet.bind(this)();
					this[dependencyCacheKey] = dp;
				}

				return this[cacheKey];
			},
			set: propertyDescriptor.set,
			enumerable: false,
			configurable: true
		}
	}
}