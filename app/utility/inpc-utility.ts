import { descriptor } from "./decorators";
import { INotifyPropertyChanged } from "./inpc";

/** Decorator that automatically impletments INotifyPropertyChanged */
export function notify()
{
    return (target: any, name: string): any =>
	{
		// Backing field
		var privateKey = "_inpc_" + name;
		descriptor({
			instance: true,
			writable: true,
			enumerable: false
		})(target, privateKey);
		
		var getter = function (this: any)
		{
			return this[privateKey];
		};
		var setter = function (this: any, value: any)
		{
			if (value == this[name])
				return;

			this[privateKey] = value;
			(<INotifyPropertyChanged>this).propertyChanged.trigger({ name: name, value: value });
		};
		
		return <PropertyDescriptor>{
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		};
	};
}
