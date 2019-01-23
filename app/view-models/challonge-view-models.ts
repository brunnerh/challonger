import { descriptor } from "../utility/decorators";
import { ExtendedArray } from "../utility/extended-array";
import { cachedGetter } from "../utility/decorators";
import { pipe } from "../utility/functional";

export interface IChallongeResponse<T extends IChallongeResponseData>
{
	status: number;
	data: T;
}

export interface IChallongeResponseData
{
	errors?: string[];
}

export interface IChallongeTournamentWrapper extends IChallongeResponseData
{
	tournament: IChallongeTournament;
}
export interface IChallongeTournament
{
	accept_attachments: boolean;
	accepting_predictions: boolean;
	allow_participant_match_reporting: boolean
	anonymous_voting: boolean;
	category: any;
	check_in_duration: any;
	completed_at: string;
	created_at: string;
	created_by_api: boolean;
	credit_capped: boolean
	description: string;
	description_source: string;
	event_id: any;
	full_challonge_url: string;
	game_id: number;
	game_name: string;
	grand_finals_modifier: any;
	group_stages_enabled: boolean;
	group_stages_were_started: boolean;
	hide_forum: boolean;
	hide_seeds: boolean;
	hold_third_place_match: boolean;
	id: number;
	live_image_url: string;
	locked_at: any;
	max_predictions_per_user: number;
	name: string;
	notify_users_when_matches_open: boolean;
	notify_users_when_the_tournament_ends: boolean;
	open_signup: boolean;
	participants_count: number;
	participants_locked: boolean;
	participants_swappable: boolean;
	predict_the_losers_bracket: any;
	prediction_method: number;
	predictions_opened_at: string;
	private: boolean;
	progress_meter: number;
	pts_for_bye: string;
	pts_for_game_tie: string;
	pts_for_game_win: string;
	pts_for_match_tie: string;
	pts_for_match_win: string;
	public_predictions_before_start_time: boolean;
	quick_advance: boolean;
	ranked: boolean;
	ranked_by: string;
	require_score_agreement: boolean;
	review_before_finalizing: boolean;
	rr_pts_for_game_tie: string;
	rr_pts_for_game_win: string;
	rr_pts_for_match_tie: string;
	rr_pts_for_match_win: string;
	sequential_pairings: boolean;
	show_rounds: boolean;
	sign_up_url: string;
	signup_cap: any;
	start_at: string;
	started_at: string;
	started_checking_in_at: string;
	state: "pending" | "group_stages_underway" | "group_stages_finalized" | "underway" | "awaiting_review" | "complete";
	subdomain: string;
	swiss_rounds: number;
	team_convertable: boolean;
	teams: boolean;
	tie_breaks: string[];
	tournament_type: "single elimination" | "double elimination" | "round robin" | "swiss";
	updated_at: string;
	url: string;
}

export interface IMatchGroup
{
	key: number;
	header: string;
	values: IChallongeMatch[];
}

export interface IChallongeParticipantWrapper extends IChallongeResponseData
{
	participant: IChallongeParticipant;
}
export interface IChallongeParticipant
{
	active: boolean;
	checked_in_at: any;
	created_at: string;
	final_rank: any;
	group_id: any;
	icon: any;
	id: number;
	group_player_ids: number[];
	invitation_id: any;
	invite_email: any;
	misc: any;
	name: string;
	on_waiting_list: boolean;
	seed: number;
	tournament_id: number;
	updated_at: string;
	challonge_username: any;
	challonge_email_address_verified: any;
	removable: boolean;
	participatable_or_invitation_attached: boolean;
	confirm_remove: boolean;
	invitation_pending: boolean;
	display_name_with_invitation_email_address: string;
	email_hash: any;
	username: any;
	attached_participatable_portrait_url: any;
	can_check_in: boolean;
	checked_in: boolean;
	reactivatable: boolean;
}

export interface IChallongeMatchWrapper extends IChallongeResponseData
{
	match: IChallongeMatch;
}

export interface IChallongeMatch
{
	attachment_count: number;
	created_at: string;
	group_id: number;
	has_attachment: boolean;
	id: number;
	identifier: string;
	location: any;
	loser_id: number | undefined;
	player1_id: number;
	player1_is_prereq_match_loser: boolean;
	player1_prereq_match_id: number;
	player1_votes: any;
	player2_id: number;
	player2_is_prereq_match_loser: boolean;
	player2_prereq_match_id: number;
	player2_votes: any;
	round: number;
	scheduled_time: any;
	started_at: string;
	state: "pending" | "open" | "complete";
	tournament_id: number;
	underway_at: any;
	updated_at: string;
	winner_id: number | "tie" | undefined;
	prerequisite_match_ids_csv: string;
	scores_csv: string
}

export interface IChallongeSet
{
	score1: number;
	score2: number;
}

export class ChallongeTournament implements IChallongeTournament
{
	accept_attachments!: boolean;
	accepting_predictions!: boolean;
	allow_participant_match_reporting!: boolean;
	anonymous_voting!: boolean;
	category: any;
	check_in_duration: any;
	completed_at!: string;
	created_at!: string;
	created_by_api!: boolean;
	credit_capped!: boolean;
	description!: string;
	description_source!: string;
	event_id: any;
	full_challonge_url!: string;
	game_id!: number;
	game_name!: string;
	grand_finals_modifier: any;
	group_stages_enabled!: boolean;
	group_stages_were_started!: boolean;
	hide_forum!: boolean;
	hide_seeds!: boolean;
	hold_third_place_match!: boolean;
	id!: number;
	live_image_url!: string;
	locked_at: any;
	max_predictions_per_user!: number;
	name!: string;
	notify_users_when_matches_open!: boolean;
	notify_users_when_the_tournament_ends!: boolean;
	open_signup!: boolean;
	participants_count!: number;
	participants_locked!: boolean;
	participants_swappable!: boolean;
	predict_the_losers_bracket: any;
	prediction_method!: number;
	predictions_opened_at!: string;
	private!: boolean;
	progress_meter!: number;
	pts_for_bye!: string;
	pts_for_game_tie!: string;
	pts_for_game_win!: string;
	pts_for_match_tie!: string;
	pts_for_match_win!: string;
	public_predictions_before_start_time!: boolean;
	quick_advance!: boolean;
	ranked!: boolean;
	ranked_by!: string;
	require_score_agreement!: boolean;
	review_before_finalizing!: boolean;
	rr_pts_for_game_tie!: string;
	rr_pts_for_game_win!: string;
	rr_pts_for_match_tie!: string;
	rr_pts_for_match_win!: string;
	sequential_pairings!: boolean;
	show_rounds!: boolean;
	sign_up_url!: string;
	signup_cap: any;
	start_at!: string;
	started_at!: string;
	started_checking_in_at!: string;
	state!: "pending" | "group_stages_underway" | "group_stages_finalized" | "underway" | "awaiting_review" | "complete";
	subdomain!: string;
	swiss_rounds!: number;
	team_convertable!: boolean;
	teams!: boolean;
	tie_breaks!: string[];
	tournament_type!: "single elimination" | "double elimination" | "round robin" | "swiss";
	updated_at!: string;
	url!: string;

	// Extended
	participants: ChallongeParticipant[] = [];
	matches: ChallongeMatch[] = [];

	@descriptor({ enumerable: false, writable: true, instance: true })
	private _matchGroups: ExtendedArray<IMatchGroup> | null = null;
	@descriptor({ enumerable: false })
	get matchGroups(): ExtendedArray<IMatchGroup>
	{
		var matches = this.matches;

		if (this._matchGroups == null ||
			pipe(this._matchGroups.flatten(g => g.values), oldMatches =>
			{
				if (oldMatches.length != matches.length)
					return true;

				if (oldMatches.every(om => matches.some(nm => om.id == nm.id)) == false)
					return true;

				return false;
			}))
		{
			var batches = ExtendedArray.from(matches)
				.group(m => <any>m.group_id)
				.map(g => ({ key: g.key, header: "", values: g.values }));
			batches.sort((a, b) => a.key - b.key);
			var groups = batches.filter(g => g.key != null).map((g, i) =>
			{
				g.header = "Group " + String.fromCharCode(65 + i);
				return g;
			});
			var final = batches.filter(g => g.key == null).map(g =>
			{
				g.header = "Final Phase";
				return g;
			});

			this._matchGroups = ExtendedArray.from(groups.concat(final));
		}

		return this._matchGroups;
	}

	queryParticipant(id: number)
	{
		var direct = this.participants.filter(p => p.id == id)[0];
		if (direct != null)
			return direct;

		return this.participants.filter(p => p.group_player_ids.some(gpid => gpid == id))[0];
	}
}

export class ChallongeParticipant implements IChallongeParticipant
{
	active!: boolean;
	checked_in_at: any;
	created_at!: string;
	final_rank: any;
	group_id: any;
	icon: any;
	id!: number;
	group_player_ids!: number[];
	invitation_id: any;
	invite_email: any;
	misc: any;
	name!: string;
	on_waiting_list!: boolean;
	seed!: number;
	tournament_id!: number;
	updated_at!: string;
	challonge_username: any;
	challonge_email_address_verified: any;
	removable!: boolean;
	participatable_or_invitation_attached!: boolean;
	confirm_remove!: boolean;
	invitation_pending!: boolean;
	display_name_with_invitation_email_address!: string;
	email_hash: any;
	username: any;
	attached_participatable_portrait_url: any;
	can_check_in!: boolean;
	checked_in!: boolean;
	reactivatable!: boolean;

	//Extended
	static readonly byeRegex = /^bye-?[0-9]+$/i;

	@descriptor({ enumerable: false, writable: true, instance: true })
	highlighted: boolean = false;

	@cachedGetter<ChallongeParticipant>(vm => vm.name)
	get is_bye() { return ChallongeParticipant.byeRegex.test(this.name); }

	@descriptor({ enumerable: false, writable: true, instance: true })
	owner: ChallongeTournament;

	constructor(owner: ChallongeTournament)
	{
		this.owner = owner;
	}
}

export class ChallongeMatch implements IChallongeMatch
{
	attachment_count!: number;
	created_at!: string;
	group_id!: number;
	has_attachment!: boolean;
	id!: number;
	identifier!: string;
	location: any;
	loser_id: number | undefined;
	player1_id!: number;
	player1_is_prereq_match_loser!: boolean;
	player1_prereq_match_id!: number;
	player1_votes: any;
	player2_id!: number;
	player2_is_prereq_match_loser!: boolean;
	player2_prereq_match_id!: number;
	player2_votes: any;
	round!: number;
	scheduled_time: any;
	started_at!: string;
	state!: "pending" | "open" | "complete";
	tournament_id!: number;
	underway_at: any;
	updated_at!: string;
	winner_id: number | "tie" | undefined;
	prerequisite_match_ids_csv!: string;
	scores_csv!: string;

	// Extended
	@cachedGetter<ChallongeMatch>(vm => vm.scores_csv)
	get scores(): IChallongeSet[]
	{
		var sets = this.scores_csv.split(",");
		return sets.map(pair => pair == "" ? { score1: 0, score2: 0 } :
			((scores) => ({ score1: scores[0], score2: scores[1] }))(pair.split(/(-?[^-]+)-(.+)/).slice(1, 3).map(n => parseInt(n))));
	}
	@cachedGetter<ChallongeMatch>(vm => vm.player1_id)
	get player1(): ChallongeParticipant | undefined
	{
		return this.owner.queryParticipant(this.player1_id);
	}
	@cachedGetter<ChallongeMatch>(vm => vm.player2_id)
	get player2(): ChallongeParticipant | undefined
	{
		return this.owner.queryParticipant(this.player2_id);
	}

	@cachedGetter<ChallongeMatch>(vm => vm.owner.state)
	get canEdit()
	{
		var tournament = this.owner;
		if (tournament.state == "complete" || tournament.state == "pending")
			return false;

		// Group match
		if (this.group_id != null)
		{
			// Group stage is over
			if (tournament.state == "underway")
				return false;
			if (tournament.state == "group_stages_underway")
				return true;
		}
		else
		{
			if (tournament.state == "underway")
				return true;
			// Final phase not yet started
			if (tournament.state == "group_stages_finalized")
				return false;
		}

		return false;
	}

	get prerequisite_match_ids(): number[]
	{
		return this.prerequisite_match_ids_csv.split(",").map(id => parseInt(id));
	}

	@descriptor({ enumerable: false, writable: true, instance: true })
	owner: ChallongeTournament;

	@descriptor({ enumerable: false, writable: true, instance: true })
	previousMatchUpdateCanceller: ng.IDeferred<any> | null = null;

	constructor(owner: ChallongeTournament)
	{
		this.owner = owner;
	}
}