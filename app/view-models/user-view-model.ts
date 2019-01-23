export interface IUserViewModel
{
	name: string;
	id: number;
}

export class UserViewModel implements IUserViewModel
{
	name: string = "";
	id: number = 0;
	
	constructor(id?: number, name?: string)
	{
		if (id != null)
			this.id = id;
		if (name != null)
			this.name = name;
	}
}