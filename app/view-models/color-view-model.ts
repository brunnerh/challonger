import { serializable, serialize } from "../utility/decorators";

@serializable()
export class ColorViewModel
{
	@serialize()
	label: string = "New Color";

	@serialize()
	value: string = "white";
}