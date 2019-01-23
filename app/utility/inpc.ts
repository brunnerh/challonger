import { BasicEvent } from "./events-utility";

export interface INotifyPropertyChangedEventArgs
{
	name: string;
	value: any;
}
export interface INotifyPropertyChanged
{
	// Raised if a property changes, invoked with the property name and the new value.
	propertyChanged: BasicEvent<this, INotifyPropertyChangedEventArgs>;
}