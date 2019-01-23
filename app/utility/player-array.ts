import { ExtendedArray } from "./extended-array";
import { PlayerViewModel } from "../view-models/player-view-model";
import { MainViewModel } from "../view-models/main-view-model";

export class PlayerArray extends ExtendedArray<PlayerViewModel>
{
	add() { this.push(new PlayerViewModel("Player " + (this.length + 1))); }

	
	constructor(public parent: MainViewModel)
	{
		super();
	}
}