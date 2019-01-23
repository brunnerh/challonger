export function pipe<T, R>(value: T, callback: (v: T) => R): R
{
	return callback(value);
}