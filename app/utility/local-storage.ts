import { INotifyPropertyChanged, INotifyPropertyChangedEventArgs } from "./inpc";
import { SubscriptionCancellationToken, BasicEvent } from "./events-utility";
import angular from "angular";

export interface IStoragePropertyOptions<T>
{
	defaultValue?: T | ((instance: any) => T) | null;
	serialize?: (value: T, instance: any) => string;
	deserialize?: (value: string, instance: any) => T;
	propertyChanged?: (instance: any, value: T) => void;
}
export interface IExtendedStoragePropertyOptions<T> extends IStoragePropertyOptions<T>
{
	reset<R>(instance: R): void;
	save<R>(instance: R): void;
	load<R>(instance: R): void;
}

export class StoragePropertyFactory
{
	defineStorageProperty<T>(name: string, options?: IStoragePropertyOptions<T>): IExtendedStoragePropertyOptions<T>
	{
		var key = this.prefix + "." + name;
		var privateKey = "_" + name;
		var propertyChangedTokenKey = privateKey + "InpcToken";
		if (options == null)
			options = {};

		if (options.defaultValue == null) options.defaultValue = null;
		if (options.serialize == null) options.serialize = (v: T) => JSON.stringify(v);
		if (options.deserialize == null) options.deserialize = (v: string) => JSON.parse(v);

		var extendedOptions = <IExtendedStoragePropertyOptions<T>>angular.merge({}, options);
		var getDefaultValue = (instance: any) =>
		{
			if (!options)
				return void 0;

			if (typeof options.defaultValue == "function")
				return (<(instance: any) => T>options.defaultValue)(instance);

			return options.defaultValue;
		};

		var isInpc = (v: any) => v != null && typeof v['propertyChanged'] == 'object';
		var tryAddInpc = (instance: any, value: any) =>
		{
			// Add INotifyPropertyChanged subscription
			if (isInpc(value))
			{
				instance[propertyChangedTokenKey] = (<INotifyPropertyChanged>value).propertyChanged.on((instance, args) =>
				{
					if (args && args.name == name)
						serialize(instance, args.value);
				});
			}
		}

		var serialize = (instance: any, value: T) =>
		{
			if (options && options.serialize != null)
				localStorage.setItem(key, value != null ? options.serialize(value, instance) : "null");
		};
		var deserialize = (instance: any) =>
		{
			var storageValue = localStorage.getItem(key);
			return storageValue != null && options && options.deserialize ?
				options.deserialize(storageValue, instance) : getDefaultValue(instance);
		};

		extendedOptions.save = (instance: any) =>
		{
			serialize(instance, instance[name]);
		};
		extendedOptions.load = (instance: any) =>
		{
			instance[name] = deserialize(instance);
		};

		var getter = function (this: any)
		{
			var value = this[privateKey];
			if (typeof value == 'undefined')
			{
				value = this[privateKey] = deserialize(this);

				tryAddInpc(this, value);
			}

			return value;
		};
		var setter = function (this: any, value: T)
		{
			if (value == this[name])
				return;

			var oldValue = this[privateKey];

			// Remove old INotifyPropertyChanged subscription
			if (isInpc(oldValue) && this[propertyChangedTokenKey] != null)
			{
				(<SubscriptionCancellationToken>this[propertyChangedTokenKey]).cancel();
				delete this[propertyChangedTokenKey];
			}

			this[privateKey] = value;
			serialize(this, value);
			tryAddInpc(this, value);

			// Property changed in options
			if (options && options.propertyChanged != null)
				options.propertyChanged(this, value);

			// INPC on instance
			if (this.propertyChanged != null)
				(<BasicEvent<any, INotifyPropertyChangedEventArgs>>this.propertyChanged).trigger({ name: name, value: value });
		};
		extendedOptions.reset = (instance: any) => instance[name] = getDefaultValue(instance);

		Object.defineProperty(this.object, name + "PropertyOptions", {
			get: () => extendedOptions,
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(this.object, name, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});

		return extendedOptions;
	}

	/**
	 * Creates a new instance.
	 * @param object: The object to define properties on.
	 * @param prefix: The prefix under which to store property values for this object.
	*/
	constructor(public object: any, public prefix: string)
	{

	}
}

/**
 * Creates a new property decorator using the given prefix.
 */
export function storagePropertyDecoratorFactory(prefix: string)
{
	/** Defines a local storage property. */
	return function storageProperty<T>(options: IStoragePropertyOptions<T>)
	{
		return (target: any, name: string): any =>
		{
			new StoragePropertyFactory(target, prefix)
				.defineStorageProperty(name, options);
		};
	}
}