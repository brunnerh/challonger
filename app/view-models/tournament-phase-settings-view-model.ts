import { AnyDict } from "../utility/any-dict";
import { serializable, serialize, descriptor } from "../utility/decorators";
import { INotifyPropertyChanged, INotifyPropertyChangedEventArgs } from "../utility/inpc";
import { BasicEvent } from "../utility/events-utility";
import { notify } from "../utility/inpc-utility";
import { ExtendedArray } from "../utility/extended-array";

export enum TournamentType
{
	SingleElimination,
	DoubleElimination,
	RoundRobin,
	Swiss
}
(<AnyDict>TournamentType)["length"] = 4;

@serializable()
export class TournamentPhaseSettingsViewModel implements INotifyPropertyChanged
{
	private _propertyChanged = new BasicEvent<this, INotifyPropertyChangedEventArgs>(this);
	get propertyChanged() { return this._propertyChanged; }
	
	get isPrelim()
	{
		return this.parent.indexOf(this) < this.parent.length - 1;
	}
	
	@serialize()
	@notify()
	type = TournamentType.DoubleElimination;
	
	get typeValid()
	{
		return this.isPrelim == false || this.type != TournamentType.Swiss;
	}
	
	get typeString() {
		switch (this.type)
		{
			case TournamentType.SingleElimination:
				return "single elimination";
			case TournamentType.DoubleElimination:
				return "double elimination";
			case TournamentType.RoundRobin:
				return "round robin";
			case TournamentType.Swiss:
				return "swiss";
		}
	}
	
	@serialize()
	@notify()
	playersPerGroup: number = 4;
	
	@serialize()
	@notify()
	playersAdvancingPerGroup: number = 2;
	
	get playersAdvancingPerGroupValid() : boolean
	{
		if (this.type == TournamentType.RoundRobin || this.type == TournamentType.Swiss)
			return true;
		
		var n = this.playersAdvancingPerGroup;
    	return (n != 0) && ((n & (n - 1)) == 0);
	}
	
	@serialize()
	@notify()
	matchForThirdPlace: boolean = false;
	
	get isValid()
	{ 
		return this.playersAdvancingPerGroupValid && this.typeValid;
	}
	
	get apiData() {
		var data = <AnyDict>{};
		var index = this.parent.indexOf(this);
		var prefix = this.isPrelim ? `tournament[group_stages_attributes][${index}]` : "tournament";
		data[prefix + (this.isPrelim ? "[stage_type]" : "[tournament_type]")] = this.typeString;
		if (this.type == TournamentType.SingleElimination && this.isPrelim == false)
		{
			data[prefix + "[hold_third_place_match]"] = this.matchForThirdPlace ? 1 : 0;
		}
		if (this.isPrelim)
		{
			data[prefix + "[group_size]"] = this.playersPerGroup;
			data[prefix + "[participant_count_to_advance_per_group]"] = this.playersAdvancingPerGroup;
		}
		
		return data;
	}
	
	@descriptor({ instance: true, enumerable: false, writable: true })
	parent: ExtendedArray<TournamentPhaseSettingsViewModel>;
	
	constructor(parent: ExtendedArray<TournamentPhaseSettingsViewModel>)
	{
		this.parent = parent;
	}
}