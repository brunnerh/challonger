//TODO: change notifications
/**
 * Extends common Array functionality.
 * Requires compilation to ES6!
 */
export class ExtendedArray<T> extends Array<T>
{
	remove(item: T)
	{
		this.splice(this.indexOf(item), 1);
	}
	removeAt(index: number)
	{
		this.splice(index, 1);
	}
	replace(oldItem: T, newItem: T)
	{
		var index = this.indexOf(oldItem);
		this[index] = newItem;
	}
	move(oldIndex: number, newIndex: number)
	{
		this.splice(newIndex, 0, this.splice(oldIndex, 1)[0]);
	}
	moveUp(item: T)
	{
		var index = this.indexOf(item);
		this.move(index, index - 1);
	}
	moveDown(item: T)
	{
		var index = this.indexOf(item);
		this.move(index, index + 1);
	}
	clear()
	{
		this.splice(0, this.length);
	}
	flatten<R>(selector: (item: T) => R[]): ExtendedArray<R>
	{
		var out = new ExtendedArray<R>();
		this.map(selector).forEach(rs => rs.forEach(r => out.push(r)));

		return out;
	}
	// Extend with comparison selector
	unique(): ExtendedArray<T>
	{
		var out = new ExtendedArray<T>();
		this.forEach(i =>
		{
			if (out.indexOf(i) < 0)
				out.push(i);
		});
		
		return out;
	}
	group<R>(selector: (item: T) => R): ExtendedArray<{ key: R, values: ExtendedArray<T> }>
	{
		var groups = new ExtendedArray<{ key: R, values: ExtendedArray<T> }>();
		this.map(i => ({ key: selector(i), value: i })).forEach(kvp =>
		{
			var group = groups.filter(g => g.key == kvp.key)[0];
			if (group == null)
			{
				group = { key: kvp.key, values: new ExtendedArray<T>() };
				groups.push(group);
			}
				
			group.values.push(kvp.value);
		});
		
		return groups;
	}
	toJSON()
	{
		return Array.from(this);
	}
	
	static from<R>(array: R[]) : ExtendedArray<R>
	{
		var a = new ExtendedArray<R>();
		array.forEach(i => a.push(i));
		
		return a;
	}
}