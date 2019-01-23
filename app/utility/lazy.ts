export class Lazy<T>
{
	private _isValueCreated = false;
	get isValueCreated()
	{
		return this._isValueCreated;
	}
	
	private _value!: T;
	get value()
	{
		if (this.isValueCreated == false)
		{
			this._value = this.valueFactory();
			this._isValueCreated = true;
		}
		
		return this._value;
	}
	
	constructor(private valueFactory: () => T)
	{
		
	}
}