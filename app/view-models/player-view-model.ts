import { serializable, serialize } from "../utility/decorators";
import { BasicEvent } from "../utility/events-utility";

@serializable()
export class PlayerViewModel
{
	@serialize()
	name = "Player 1";
	@serialize()
	isAttending = true;
	autofocus = new BasicEvent(this);
	@serialize()
	highlighting: string = "unset";

	constructor(name?: string)
	{
		if (name != null)
			this.name = name;
	}

	toString()
	{
		return `${this.name}`;
	}
}