import { storagePropertyDecoratorFactory, IExtendedStoragePropertyOptions } from "../utility/local-storage";
import { AnyDict } from "../utility/any-dict";
import { INotifyPropertyChanged, INotifyPropertyChangedEventArgs } from "../utility/inpc";
import { Lazy } from "../utility/lazy";
import { NotificationService, MessageButtonLayout, ConfirmButtonType } from "../utility/notifications";
import { BasicEvent } from "../utility/events-utility";
import { ColorViewModel } from "./color-view-model";
import { ExtendedArray } from "../utility/extended-array";
import { UserViewModel, IUserViewModel } from "./user-view-model";
import { TournamentPhaseSettingsViewModel, TournamentType } from "./tournament-phase-settings-view-model";
import { ChallongeTournament, ChallongeParticipant, ChallongeMatch, IChallongeTournament, IChallongeResponseData, IChallongeTournamentWrapper, IChallongeParticipantWrapper, IChallongeMatchWrapper, IChallongeMatch, IChallongeParticipant } from "./challonge-view-models";
import { cachedGetter } from "../utility/decorators";
import { PlayerArray } from "../utility/player-array";
import { PlayerViewModel } from "./player-view-model";
import { config } from "../../config";
import angular from "angular";


function escapeRegExp(str: string)
{
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function selectText(element: HTMLElement)
{
	var range = document.createRange();
	range.selectNode(element);
	window.getSelection().addRange(range);
}

var storageProperty = storagePropertyDecoratorFactory("main-view-model");
export class MainViewModel implements INotifyPropertyChanged
{
	[key: string]: any;

	private _$q = new Lazy(() => this.$injector.get("$q"))
	get $q() { return this._$q.value; }

	get version() { return config.version; }

	get notify() { return NotificationService.instance; }

	private _propertyChanged = new BasicEvent<this, INotifyPropertyChangedEventArgs>(this);
	get propertyChanged() { return this._propertyChanged; }

	simpleKeys: string[] = [];
	protectedKeys = ['apiKey'];
	playerListKeys = ["players"];
	extendedArrayKeys = [{ key: "highlightingColors", itemCtor: ColorViewModel }];


	@storageProperty({ defaultValue: "" })
	apiKey!: string;

	get apiEnabled() { return this.apiKey && this.apiKey.trim() !== ''; }
	apiKeyValid: boolean | null = null;

	@storageProperty({ defaultValue: false })
	seenDisclaimer!: boolean;

	@storageProperty({ defaultValue: "" })
	tournamentName!: string;

	//TODO: change name to UrlPart
	@storageProperty({ defaultValue: "", propertyChanged: (vm: MainViewModel, value: string) => vm.tournamentIDChanged(value) })
	tournamentID!: string;
	tournamentIDChanged(value: string)
	{
		this.apiCall<IUrlCheckResult>(
			null,
			null,
			{
				utility: "url_check",
				identifier: value
			}
		).then(res => this.tournamentIDCheckResult = res.data || null);
	}
	tournamentIDCheckResult: IUrlCheckResult | null = null;

	@storageProperty({ defaultValue: "Super Smash Bros. Melee" })
	tournamentGameName!: string;

	@storageProperty({
		defaultValue: new ExtendedArray<UserViewModel>(),
		deserialize: (arrayString: string) =>
		{
			var source = <IUserViewModel[]>JSON.parse(arrayString);
			var array = new ExtendedArray<UserViewModel>();
			source.forEach(s => array.push(new UserViewModel(s.id, s.name)));
			return array;
		}
	})
	tournamentAdmins!: ExtendedArray<UserViewModel>;
	tournamentAdminsPropertyOptions!: IExtendedStoragePropertyOptions<ExtendedArray<UserViewModel>>;
	private _challongeUserNameSearch = "";
	private challongeUserNameSearchCanceller: ng.IDeferred<any> | null = null;
	get challongeUserNameSearch() { return this._challongeUserNameSearch; }
	set challongeUserNameSearch(value: string)
	{
		if (this._challongeUserNameSearch == value)
			return;

		this._challongeUserNameSearch = value;
		if (value == null || value.trim() == "")
			this.challongeUserNameSearchResults = [];
		else
		{
			if (this.challongeUserNameSearchCanceller != null)
				this.challongeUserNameSearchCanceller.resolve();

			this.apiCall<IUserViewModel[]>(
				null,
				null,
				{
					utility: "user_search",
					q: this.challongeUserNameSearch
				},
				this.challongeUserNameSearchCanceller = this.$q.defer()
			).then(res =>
			{
				if (res.data == null)
					return;

				// Filter already added.
				var users = res.data.filter(u => this.tournamentAdmins.some(a => a.id == u.id) == false);
				this.challongeUserNameSearchResults = users;
			}, (e: any) => this.notify.showError(`An error occurred (${e}).`));
		}
	}
	challongeUserNameSearchResults: IUserViewModel[] = [];

	@storageProperty({
		defaultValue: () =>
		{
			var p = new ExtendedArray<TournamentPhaseSettingsViewModel>();
			var groups = new TournamentPhaseSettingsViewModel(p);
			groups.type = TournamentType.RoundRobin;
			p.push(groups);
			var final = new TournamentPhaseSettingsViewModel(p);
			final.type = TournamentType.DoubleElimination;
			p.push(final);
			return p;
		},
		deserialize: (arrayString: string) =>
		{
			var source = <TournamentPhaseSettingsViewModel[]>JSON.parse(arrayString);
			var array = new ExtendedArray<TournamentPhaseSettingsViewModel>();
			source.forEach(s => array.push(angular.merge(new TournamentPhaseSettingsViewModel(array), s)));
			return array;
		}
	})
	tournamentPhases!: ExtendedArray<TournamentPhaseSettingsViewModel>;
	tournamentPhasesPropertyOptions!: IExtendedStoragePropertyOptions<ExtendedArray<TournamentPhaseSettingsViewModel>>;
	tournamentPhasesAddNew() { this.tournamentPhases.push(new TournamentPhaseSettingsViewModel(this.tournamentPhases)); }

	@storageProperty({
		defaultValue: new ExtendedArray<ChallongeTournament>(),
		deserialize: (arrayString: string, vm: MainViewModel) =>
		{
			return ExtendedArray.from<ChallongeTournament>((JSON.parse(arrayString)).map((t: ChallongeTournament) =>
			{
				t = angular.merge(new ChallongeTournament(), t);
				if (t.matches != null)
				{
					var matches = t.matches;
					var preprocess = (participants: ChallongeParticipant[]) =>
					{
						for (var pi = 0; pi < participants.length; pi++)
							participants[pi] = angular.merge(new ChallongeParticipant(t), participants[pi]);
						for (var mi = 0; mi < matches.length; mi++)
							matches[mi] = angular.merge(new ChallongeMatch(t), matches[mi]);
					};
					if (t.participants != null)
						preprocess(t.participants);
					else
						vm.getParticipants(t).then(p => 
						{
							if (p) preprocess(p);
						});
				}
				return t;
			}));
		}
	})
	userTournaments!: ExtendedArray<ChallongeTournament>;
	userTournamentsPropertyOptions!: IExtendedStoragePropertyOptions<ExtendedArray<ChallongeTournament>>;
	userTournamentsLoading = false;
	loadTournamentUrl = "";

	@storageProperty({ defaultValue: null, propertyChanged: (vm: MainViewModel) => vm.selectedUserTournamentIDChanged() })
	selectedUserTournamentID!: number | null;
	selectedUserTournamentIDChanged()
	{
		// Update participants/matches	
		var t = this.selectedUserTournament;
		if (t != null && (t.participants.length == 0 || t.matches.length == 0))
			this.updateCompleteTournament(t);
	}
	@cachedGetter<MainViewModel>(vm => vm.selectedUserTournamentID)
	get selectedUserTournament(): ChallongeTournament | null
	{
		return this.userTournaments.filter(t => t.id == this.selectedUserTournamentID)[0];
	}
	selectedUserTournamentLoading = false;

	matchPlayerFilter: string = "";

	get tournamentIsValid()
	{
		return this.tournamentPhases.length > 0 && this.tournamentPhases.every(p => p.isValid) &&
			this.tournamentName != null && this.tournamentName.trim() != "" &&
			this.tournamentID != null && this.tournamentID.trim() != "" &&
			(this.tournamentIDCheckResult == null || this.tournamentIDCheckResult.valid == true);
	}

	@storageProperty({
		defaultValue: (vm: MainViewModel) =>
		{
			var p = new PlayerArray(vm);
			p.push(new PlayerViewModel("Powerzerstörer"));
			return p;
		},
		deserialize: (arrayString: string, vm: MainViewModel) =>
		{
			var source = <PlayerViewModel[]>JSON.parse(arrayString);
			var array = new PlayerArray(vm);
			source.forEach(s => array.push(angular.merge(new PlayerViewModel(), s)));
			return array;
		}
	})
	players!: PlayerArray;
	playersPropertyOptions!: IExtendedStoragePropertyOptions<PlayerArray>;
	get attendees() { return this.players.filter(p => p.isAttending); }

	focusedPlayer!: PlayerViewModel;

	get areAllAttending() { return this.players.every(p => p.isAttending); }
	set areAllAttending(value: boolean) { this.players.forEach(p => p.isAttending = value); }


	@storageProperty({
		defaultValue: new ExtendedArray<ColorViewModel>({ label: "None", value: "unset" }, { label: "Red", value: "hsla(0, 100%, 70%, 1)" }, { label: "Yellow", value: "hsla(60, 100%, 65%, 1)" }, { label: "Green", value: "hsla(120, 100%, 65%, 1)" }, { label: "Cyan", value: "hsla(180, 100%, 65%, 1)" }, { label: "Blue", value: "hsla(240, 100%, 75%, 1)" }, { label: "Magenta", value: "hsla(300, 100%, 75%, 1)" }),
		deserialize: (arrayString: string) =>
		{
			var source = <ColorViewModel[]>JSON.parse(arrayString);
			return ExtendedArray.from(source.map(c => angular.merge(new ColorViewModel(), c)));
		}
	})
	highlightingColors!: ExtendedArray<ColorViewModel>;
	highlightingColorsPropertyOptions!: IExtendedStoragePropertyOptions<ExtendedArray<ColorViewModel>>;

	highlightingColorExists(value: string)
	{
		return this.highlightingColors.some(c => c.value == value);
	}

	private flatten<T>(a: T[][])
	{
		return <T[]>Array.prototype.concat.apply([], a);
	}

	@cachedGetter<MainViewModel>(vm => ({
		players: vm.attendees.map(a => a),
		phases: vm.tournamentPhases.map(p => JSON.stringify(p))
	}))
	get groups(): PlayerViewModel[][]
	{
		if (this.tournamentPhases.length < 1)
			return [[]];

		if (this.tournamentPhases.length == 1)
			return [this.attendees.map(a => a)];

		var attendees = this.attendees;

		var groupsCount = Math.ceil(attendees.length / this.tournamentPhases[0].playersPerGroup);
		var totalPlayerCount = groupsCount * this.tournamentPhases[0].playersPerGroup;
		var groups = <PlayerViewModel[][]>new Array(groupsCount);
		groups.fill(<any>1);
		groups = groups.map(() => []);

		var g = 0;
		var dir = true; //Down = true
		for (var i = 0; i < totalPlayerCount; i++ , dir ? g++ : g--)
		{
			if (g == -1)
			{
				g = 0;
				dir = true;
			}
			if (g == groupsCount)
			{
				g = groupsCount - 1;
				dir = false;
			}

			var addedPlayer: PlayerViewModel;
			if (i < attendees.length)
			{
				addedPlayer = attendees[i];
			}
			else
			{
				addedPlayer = new PlayerViewModel(`bye-${i + 1}`);
				addedPlayer.highlighting = "hsla(0, 0%, 100%, 0.5)";
			}
			groups[g].push(addedPlayer);
		}

		return groups;
	}

	seed(p: PlayerViewModel)
	{
		var index = this.attendees.indexOf(p);

		return index == -1 ? "" : `${index + 1}.`;
	}

	paste(e: ClipboardEvent)
	{
		var mime = "text/plain";
		var target = <HTMLElement>e.target;
		if (['INPUT', 'TEXTAREA'].some(t => target.tagName == t) == false &&
			e.clipboardData.types.indexOf(mime) > -1 &&
			confirm("Do you want to replace the roster with the clipboard data?"))
		{
			var players = e.clipboardData.getData(mime);
			this.players.clear();
			players.split("\n").forEach(p =>
			{
				if (p.match(/^\W*$/) || p.match(ChallongeParticipant.byeRegex))
					return;

				this.players.push(new PlayerViewModel(p))
			});
			e.preventDefault();
		}
	}
	save()
	{
		var json = this.createStateString(true, true);
		var element = document.createElement('a');
		element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(json));
		element.setAttribute('download', `Challonger ${new Date().toGMTString()}.json`);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
	createStateString(indent = false, includeProtectedKeys = false)
	{
		var params = <AnyDict>{};
		if (includeProtectedKeys)
			this.protectedKeys.forEach(key => params[key] = this[key]);
		this.simpleKeys.forEach(key => params[key] = this[key]);
		this.playerListKeys.forEach(key => params[key] = this[key].map((p: PlayerViewModel) => p));
		this.extendedArrayKeys.forEach(key => params[key.key] = this[key.key].map((i: any) => i));
		return JSON.stringify(params, null, indent ? "\t" : void 0);
	}
	loadState(state: any)
	{
		this.simpleKeys.concat(this.protectedKeys).forEach(key =>
		{
			if (state[key] != null)
				this[key] = state[key];
		});
		this.playerListKeys.forEach(key =>
		{
			if (state[key] == null)
				return;

			this[key].clear();
			state[key].forEach((p: any) =>
			{
				var player: PlayerViewModel;
				// Backward compatibility
				if (typeof p == "string")
					player = new PlayerViewModel(p);
				else
					player = angular.merge(new PlayerViewModel(), p);

				this[key].push(player);
			});
		});
		this.extendedArrayKeys.forEach(key =>
		{
			if (state[key.key] == null)
				return;

			this[key.key].clear();
			state[key.key].forEach((i: any) => this[key.key].push(angular.merge(new key.itemCtor(), i)));
		});
	}
	load(e: Event)
	{
		var target = <HTMLInputElement>e.target;
		if (target.files)
			this.loadFile(target.files[0], () => target.value = "");
	}
	loadDrop(e: DragEvent)
	{
		if (e.dataTransfer == null || e.dataTransfer.files.length == 0)
			return;

		this.loadFile(e.dataTransfer.files[0]);
		e.preventDefault();
	}
	private loadFile(file: File, loaded?: () => void)
	{
		var reader = new FileReader();
		reader.onload = () =>
		{
			this.$scope.$applyAsync(() =>
			{
				if (reader.result == null) return;

				this.loadState(JSON.parse(reader.result.toString()));
				if (loaded != null)
					loaded();
			});
		};
		reader.readAsText(file);
	}

	editColors()
	{
		// Copy colors and associate them with players
		var colors = ExtendedArray.from<{ label: string, value: string, players?: PlayerViewModel[] }>(this.highlightingColors.map(x => angular.copy(x)));
		colors.forEach(c =>
			c.players = this.players.filter(p => p.highlighting == c.value)
		);

		this.$http.get<string>("./../templates/edit-colors-dialog.html")
			.then(
				res =>
				{
					if (res.data == null) throw new Error("No data returned.");

					var scope = this.$scope.$new(true);

					this.dragulaService.options(scope, "colors", {
						moves: (_el: any, _source: any, handle: HTMLElement) =>
							handle.classList.contains("drag-handle")
					});

					angular.extend(scope, { viewModel: colors });
					var dialogContent = this.$injector.get("$compile")(res.data)(scope);

					var onClose = this.notify.showMessage(dialogContent[0], {
						modal: true,
						buttonLayout: MessageButtonLayout.Dialog,
						closeButton: false,
						buttons: [
							{
								label: "OK",
								click: () => true,
								tag: true,
							},
							{
								label: "Cancel",
								click: () => true,
								tag: false,
							}
						]
					});

					onClose.on((_s, e) =>
					{
						// Escape key
						if (e == null)
							return;

						// Cancel clicked
						if (e.tag == false)
							return;

						// OK clicked
						this.$scope.$applyAsync(() =>
						{
							// Update player colors.
							colors.forEach(c =>
							{
								if (c.players != null)
									c.players.forEach(p => p.highlighting = c.value);
							});
							this.highlightingColors.clear();
							colors.forEach(c => this.highlightingColors.push({
								label: c.label,
								value: c.value
							}));
						});
					});
				},
				(error: any) => this.notify.showError(`Could not load dialog. [${error}]`)
			);
	}

	reset()
	{
		if (confirm("You sure though?"))
		{
			const url = currentUrl();
			url.search = '';
			history.replaceState(null, "", url.toString());
			this.playersPropertyOptions.reset(this);
			this.tournamentPhasesPropertyOptions.reset(this);
			this.highlightingColorsPropertyOptions.reset(this);
		}
	}
	clear()
	{
		var temp = this.players.slice();
		this.players.clear();

		this.notify.showMessage("Cleared player list.", {
			timeout: 10000,
			buttons: [{
				label: "Undo",
				click: () =>
				{
					this.players.clear();
					temp.forEach(p => this.players.push(p));

					return true;
				}
			}]
		})
	}

	get permalink()
	{
		const url = currentUrl();
		url.search = '';
		url.searchParams.set('state', this.createStateString(false, false));

		return url.toString();
	}

	playerKeyDown(player: PlayerViewModel, e: KeyboardEvent)
	{
		var index = this.players.indexOf(player);
		// No modifiers: select/new player
		if (e.ctrlKey == false && e.altKey == false && e.shiftKey == false)
		{
			if (e.code == "ArrowDown" || e.code == "Enter")
				if (index + 1 < this.players.length)
					this.players[index + 1].autofocus.trigger();
				else
					this.addPlayer();

			if (e.code == "ArrowUp" && index - 1 >= 0)
				this.players[index - 1].autofocus.trigger();
		}
		// ctrl: move/delete/toggle
		if (e.ctrlKey == true && e.altKey == false && e.shiftKey == false)
		{
			if ((e.code == "ArrowDown" || e.code == "Enter") && index + 1 < this.players.length)
			{
				this.players.move(index, index + 1);
				player.autofocus.trigger();
			}

			if (e.code == "ArrowUp" && index - 1 >= 0)
			{
				this.players.move(index, index - 1);
				player.autofocus.trigger();
			}

			if (e.code == "Delete")
			{
				this.players.remove(player);
				if (index < this.players.length == false)
					index = this.players.length - 1;
				if (index >= 0)
					this.players[index].autofocus.trigger();
			}

			if (e.code == "Space")
				player.isAttending = !player.isAttending;
		}
	}
	addPlayer()
	{
		var p = new PlayerViewModel("Player " + (this.players.length + 1));
		setTimeout(() => p.autofocus.trigger(), 0);

		this.players.push(p);
	}
	savePlayersLocally()
	{
		this.playersPropertyOptions.save(this);
		this.highlightingColorsPropertyOptions.save(this);
		this.notify.showMessage("Done.");
	}
	loadPlayersLocally()
	{
		this.playersPropertyOptions.load(this);
		this.highlightingColorsPropertyOptions.load(this);
		this.notify.showMessage("Done.");
	}

	copyResult()
	{
		var result = <HTMLTextAreaElement>document.querySelector(".groups-preview");
		selectText(result);
		document.execCommand("copy", true);
		this.notify.showMessage("Copied.");
	}

	openTournamentSettings(tournament: IChallongeTournament)
	{
		window.open(`${tournament.full_challonge_url}/settings`, "_blank");
	}

	processPotentialChallongeError(responseData?: IChallongeResponseData)
	{
		if (responseData && responseData.errors != null)
		{
			this.notify.showError(`A Challonge error occurred (${responseData.errors.join(", ")}).`);
			return true;
		}

		return false;
	}

	apiCall<T>(
		endpoint: string | null,
		method: "POST" | "PUT" | "GET" | "DELETE" | null,
		data?: any,
		canceller?: ng.IDeferred<any>
	): ng.IHttpPromise<T>
	{
		if (data == null) data = {};

		data.api_key = this.apiKey;

		var promise = this.$http<T>({
			url: config.apiUrl,
			method: "POST",
			data: <IApiData>{
				method: method,
				api_data: data,
				endpoint: endpoint
			},
			timeout: canceller == null ? void 0 : canceller.promise
		});
		promise.finally(() => this.$scope.$applyAsync());

		return promise;
	}

	loadTournamentFromUrl()
	{
		var match = this.loadTournamentUrl.match(/\.com\/(.*)$/);
		if (match == null)
		{
			this.notify.showError("URL invalid.");
			return;
		}

		this.getTournament(match[1]).then(t =>
		{
			if (t)
				this.notify.showMessage(`Tournament "${t.name}" loaded.`);
		})
	}

	getTournament(idOrUrl: number | string)
	{
		return this.apiCall<IChallongeTournamentWrapper>(
			`/tournaments/${idOrUrl}.json`,
			"GET"
		).then(res =>
		{
			if (this.processPotentialChallongeError(res.data) || res.data == null)
				return null;

			var tournament = <ChallongeTournament>angular.merge(new ChallongeTournament(), res.data.tournament);
			var t = this.updateOrPrependArray(this.userTournaments, tournament);
			this.userTournamentsPropertyOptions.save(this);

			return t;
		}, error =>
			{
				this.notify.showError(`Could not load tournament (${error}).`);
				return null;
			});
	}

	getTournaments()
	{
		if (this.apiEnabled == false)
			return null;

		var p = this.apiCall<IChallongeTournamentWrapper[]>(
			"/tournaments.json",
			"GET"
		).then(
			res =>
			{
				if (this.processPotentialChallongeError(<any>res.data) || res.data == null)
				{
					this.apiKeyValid = false;
					return null;
				}

				var resultTournaments = res.data.map(t => angular.merge(new ChallongeTournament(), t.tournament));
				this.mergeArrays(this.userTournaments, resultTournaments);
				this.userTournamentsPropertyOptions.save(this);
				this.apiKeyValid = true;

				return this.userTournaments;
			},
			() =>
			{
				this.apiKeyValid = false;
				return null;
			}
		);

		this.userTournamentsLoading = true;
		p.then(() => this.userTournamentsLoading = false);

		return p;
	}

	createTournament()
	{
		var data = <AnyDict>{
			"tournament[name]": this.tournamentName,
			"tournament[url]": this.tournamentID,
			"tournament[game_name]": this.tournamentGameName,
			"shared_administration": 1,
			"tournament[admin_ids_csv]": this.tournamentAdmins.map(u => u.id).join(",")
		};
		if (this.tournamentPhases.length > 1)
			data["tournament[group_stages_enabled]"] = 1;

		this.tournamentPhases.forEach(e =>
			angular.extend(data, e.apiData)
		);

		return this.apiCall<IChallongeTournamentWrapper>(
			"/tournaments.json",
			"POST",
			data
		).then(
			res =>
			{
				if (this.processPotentialChallongeError(res.data) || res.data == null)
					return;

				this.notify.showMessage("Tournament created...");
				var tournament = angular.merge(new ChallongeTournament(), res.data.tournament);
				this.userTournaments.unshift(tournament);
				return this.apiCall<IChallongeParticipantWrapper[]>(
					`/tournaments/${this.tournamentID}/participants/bulk_add.json`,
					"POST",
					{
						"bulk_participants": this.flatten(this.groups).join("\r\n")
					}
				).then(res =>
				{
					if (this.processPotentialChallongeError(<any>res.data) || res.data == null)
						return;

					this.notify.showMessage("Players added...");
					tournament.participants = res.data.map(pw => angular.merge(new ChallongeParticipant(tournament), pw.participant));
					this.selectedUserTournamentID = tournament.id;

					window.open(`http://www.challonge.com/${this.tournamentID}`, "_blank");

					return tournament;
				}, error =>
					{
						this.notify.showError(`Could not add players (${error.message}).`);
					})
			},
			error =>
			{
				this.notify.showError(`Could not create tournament (${error.message}).`);
			}
		);
	}

	deleteTournament(tournament: IChallongeTournament)
	{
		if (confirm("Do you really want to delete this tournament?") == false)
			return;

		this.apiCall<IChallongeResponseData>(
			`/tournaments/${tournament.id}.json`,
			"DELETE"
		).then(res =>
		{
			// Presumably requests tournament after deletion, leading to error.
			if (res.data == null || res.data.errors != null && res.data.errors[0] != "Requested tournament not found"
				&& this.processPotentialChallongeError(res.data))
				return;

			this.userTournaments.splice(this.userTournaments.map(t => t.id).indexOf(tournament.id), 1);
			if (this.selectedUserTournamentID == tournament.id)
				this.selectedUserTournamentID = null;

			this.userTournamentsPropertyOptions.save(this);
		}, error => this.notify.showError(`Could not delete tournament (${error}).`));
	}

	finalStageString(tournament: IChallongeTournament)
	{
		switch (tournament.tournament_type)
		{
			case "round robin":
				return "RR";
			case "single elimination":
				return "Bracket (S)";
			case "double elimination":
				return "Bracket (D)";
			case "swiss":
				return "Swiss";
		}
	}

	mergeArrays<T extends { id: number }>(destinationArray: T[], sourceArray: T[]): T[]
	{
		// Remove items no longer found in new array.
		var removeIndices: number[] = [];
		destinationArray.forEach((d, i) =>
		{
			if (sourceArray.some(s => s.id == d.id) == false)
				removeIndices.push(i);
		});
		removeIndices.sort((a, b) => b - a);
		removeIndices.forEach(i => destinationArray.splice(i, 1));

		// Add / merge
		sourceArray.forEach(s => this.updateOrPrependArray(destinationArray, s));

		return destinationArray;
	}

	updateOrPrependArray<T extends { id: number }>(array: T[], item: T): T
	{
		var index = array.map(i => i.id).indexOf(item.id);
		if (index == -1)
		{
			array.unshift(item);
			return item;
		}
		else
		{
			return <T>angular.merge(array[index], item);
		}
	}

	startTournament(tournament: IChallongeTournament): ng.IPromise<IChallongeTournament | null> | null
	{
		if (confirm("Are you sure you want to start the tournament/phase?") == false)
			return null;

		// Starting the group phase is currently not supported.
		return this.apiCall<IChallongeTournamentWrapper>(
			`/tournaments/${tournament.id}/start.json`,
			"POST"
		).then(res =>
		{
			if (this.processPotentialChallongeError(res.data) || res.data == null)
				return null;

			return this.updateOrPrependArray(this.userTournaments, res.data.tournament);
		},
			error =>
			{
				this.notify.showError(`Could not create tournament (${error.message}).`);
				return null;
			});
	}

	finalizeTournament(tournament: IChallongeTournament): ng.IPromise<IChallongeTournament | null> | null
	{
		if (confirm("Are you sure you want to finalize the tournament?") == false)
			return null;

		return this.apiCall<IChallongeTournamentWrapper>(
			`/tournaments/${tournament.id}/finalize.json`,
			"POST"
		).then(res =>
		{
			if (this.processPotentialChallongeError(res.data) || res.data == null)
				return null;

			return this.updateOrPrependArray(this.userTournaments, res.data.tournament);
		},
			error =>
			{
				this.notify.showError(`Could not finalize tournament (${error.message}).`);
				return null;
			});
	}
	getParticipants(tournament: ChallongeTournament): ng.IPromise<ChallongeParticipant[] | null>
	{
		return this.apiCall<IChallongeParticipantWrapper[]>(
			`/tournaments/${tournament.id}/participants.json`,
			"GET"
		).then(res =>
		{
			if (this.processPotentialChallongeError(<any>res.data) || res.data == null)
				return null;

			this.mergeArrays(tournament.participants, res.data.map(mw => angular.merge(new ChallongeParticipant(tournament), mw.participant)));
			this.userTournamentsPropertyOptions.save(this);

			return tournament.participants;
		},
			error =>
			{
				this.notify.showError(`Could not get participants (${error.message}).`);
				return null;
			}
		);
	}

	participantHighlight(participant: ChallongeParticipant, value: boolean)
	{
		if (participant != null)
			participant.highlighted = value;
	}

	getMatches(tournament: ChallongeTournament): ng.IPromise<ChallongeMatch[] | null>
	{
		return this.apiCall<IChallongeMatchWrapper[]>(
			`/tournaments/${tournament.id}/matches.json`,
			"GET"
		).then(res =>
		{
			if (this.processPotentialChallongeError(<any>res.data) || res.data == null)
				return null;

			this.mergeArrays(tournament.matches, res.data.map(mw => angular.merge(new ChallongeMatch(tournament), mw.match)));
			this.userTournamentsPropertyOptions.save(this);

			return tournament.matches;
		},
			error =>
			{
				this.notify.showError(`Could not get matches (${error.message}).`);
				return null;
			}
		);
	}

	updateCompleteTournament(tournament: ChallongeTournament): ng.IPromise<ChallongeTournament | null>
	{
		this.selectedUserTournamentLoading = true;
		return this.getTournament(tournament.id).then(t =>
			this.getParticipants(tournament).then(() =>
				this.getMatches(tournament).then(() =>
				{
					this.selectedUserTournamentLoading = false;
					return t;
				})));
	}
	queryMatch(tournament: ChallongeTournament, id: number)
	{
		return tournament.matches.filter(m => m.id == id)[0];
	}
	filterMatches = (match: ChallongeMatch) =>
	{
		if (this.matchPlayerFilter.trim() == "" ||
			match.player1 == null || match.player2 == null)
			return true;

		var matches = (name: string) =>
			this.matchPlayerFilter == name;
		return matches(match.player1.name) || matches(match.player2.name);
	}
	getMatchScoresCsv(match: ChallongeMatch)
	{
		return match.scores.map(set => set.score1 + "-" + set.score2).join(",");
	}
	getWinnerId(match: IChallongeMatch, winner: ChallongeParticipant | "tie"): number | "tie"
	{
		if (winner == "tie")
			return "tie";

		var w = <IChallongeParticipant>winner;
		return match.group_id != null ? w.group_player_ids[0] : w.id;
	}
	submitMatch(match: ChallongeMatch, winner?: ChallongeParticipant | "tie"): ng.IPromise<ChallongeMatch | null> | null
	{
		// Check editability
		var canEdit = match.canEdit;
		if (canEdit == false)
			return null;

		// Check validity
		if (match.scores.some(set => set.score1 == null || set.score2 == null))
			return null;

		var data = {
			'match[scores_csv]': this.getMatchScoresCsv(match),
			'match[winner_id]': match.winner_id
		};
		if (winner != null)
		{
			//TODO: fix ties not being committed
			var id = this.getWinnerId(match, winner);
			data['match[winner_id]'] = id;
		}
		else
		{
			//TODO: set as underway (following does not work)
			// data['match[underway_at]'] = formatLocalDate();
		}

		if (match.player1 == null || match.player2 == null)
			throw this.matchNotProcessedError();
		var matchInfoPrefix = `[${match.player1.name} vs. ${match.player2.name}]`;

		var makeRequest = () =>
		{
			if (match.previousMatchUpdateCanceller != null)
				match.previousMatchUpdateCanceller.resolve();

			return this.apiCall<IChallongeMatchWrapper>(
				`/tournaments/${match.tournament_id}/matches/${match.id}.json`,
				"PUT",
				data,
				match.previousMatchUpdateCanceller = this.$q.defer()
			).then(res =>
			{
				if (this.processPotentialChallongeError(res.data) || res.data == null)
					return null;

				angular.merge(match, res.data.match);
				this.notify.showMessage(`${matchInfoPrefix} ${winner == null ? "Match scores updated." : "Winner submitted."}`);
				this.userTournamentsPropertyOptions.save(this);

				match.owner.matches.filter(m => m.prerequisite_match_ids.some(id => id == match.id))
					.forEach(followingMatch => this.updateMatch(followingMatch));

				return match;
			},
				error =>
				{
					this.notify.showError(`Could not set winner (${error.message}).`);
					return null;
				}
			);
		};

		// Prevent partial reset of bracket by overwriting winner.
		// TODO: fix logic for bracket group stages
		if (winner != null && match.group_id == null
			&& match.winner_id != null && match.winner_id != this.getWinnerId(match, winner))
		{
			return this.$q<ChallongeMatch | null>(resolve =>
			{
				this.notify.showMessage(`${matchInfoPrefix} Are you sure you want to change the winner for this match? (Later matches will be reset.)`, {
					modal: true,
					classes: ["warning"],
					closeButton: false,
					timeout: -1,
					buttons: [
						{
							label: "Yes",
							click: () => { resolve(<any>makeRequest()); return true; } //TODO: test cast
						},
						{
							label: "No",
							click: () => { resolve(null); return true; }
						}
					]
				});
			});
		}
		else return makeRequest();
	}

	updateMatch(match: ChallongeMatch)
	{
		this.apiCall<IChallongeMatchWrapper>(
			`/tournaments/${match.owner.id}/matches/${match.id}.json`,
			"GET"
		).then(res =>
		{
			if (this.processPotentialChallongeError(res.data) || res.data == null)
				return;

			angular.merge(match, res.data.match);
			this.userTournamentsPropertyOptions.save(this);

			return match;
		}, error => this.notify.showError(`Could not update match (${error.message}).`));
	}

	canEliminateByes(tournament: ChallongeTournament): boolean
	{
		return ["pending", "complete"].some(s => tournament.state == s) == false;
	}
	eliminateByes(tournament: ChallongeTournament)
	{
		var promises: ng.IPromise<ChallongeMatch | null>[] = [];

		var processMatches = (matches: ChallongeMatch[]) =>
		{
			matches.filter(m => m.canEdit && m.winner_id == null).forEach(match =>
			{
				if (match.player1 == null || match.player2 == null || match.scores == null)
					throw this.matchNotProcessedError();

				var p1 = match.player1;
				var p2 = match.player2;

				if (p1.is_bye)
					match.scores[0].score1 = -1;
				if (p2.is_bye)
					match.scores[0].score2 = -1;

				if (p1.is_bye == false && p2.is_bye == false)
					return;

				var winner = p1.is_bye && p2.is_bye ? <"tie">"tie" : (p1.is_bye ? p2 : p1);

				var promise = this.submitMatch(match, winner);
				if (promise != null)
					promises.push(promise);
			});
			if (promises.length == 0)
				this.notify.showMessage("Nothing to do.");
			else
				Promise.all(promises).then(() => this.notify.showMessage("Done."));
		};

		processMatches(tournament.matches);
	}

	loadPlayers(tournament: ChallongeTournament)
	{
		this.getParticipants(tournament).then(participants =>
		{
			if (participants == null)
				return;

			var actualParticipants = participants.filter(p => p.is_bye == false)
				.sort((a, b) => a.seed - b.seed);

			if (actualParticipants.length == 0)
			{
				this.notify.showMessage("The tournament has no participants.");
			}
			else
			{
				this.players.clear();
				if (tournament.group_stages_enabled == false)
				{
					actualParticipants.map(p => p.name).forEach(n => this.players.push(new PlayerViewModel(n)));
				}
				else
				{
					if (tournament.matchGroups == null)
						throw new Error("Match groups not calculated.")

					// Group player IDs hold the initial ordering of the participants, which is one group after another.
					var groupParticipants = participants.map(p => p).sort((a, b) => a.group_player_ids[0] - b.group_player_ids[0]);
					var groups = tournament.matchGroups.filter(g => g.key != null);
					var playersPerGroup = Math.ceil(groupParticipants.length / groups.length);
					var g = 0;
					var dir = true; // true == down
					for (var i = 0; i < groupParticipants.length; i++ , dir ? g++ : g--)
					{
						if (g == groups.length)
						{
							dir = false;
							g = groups.length - 1;
						}
						if (g == -1)
						{
							dir = true;
							g = 0;
						}

						var inGroupIndex = Math.floor(i / groups.length);

						var p = groupParticipants[g * playersPerGroup + inGroupIndex];
						if (p.is_bye == false)
							this.players.push(new PlayerViewModel(p.name));
					}
				}
				this.notify.showMessage("Players loaded.");
			}
		})
	}

	canLoadAmateurPlayers(tournament: ChallongeTournament): boolean
	{
		return tournament.group_stages_enabled == true &&
			["underway", "awaiting_review", "complete"].some(s => tournament.state == s);
	}
	loadAmateurPlayers(tournament: ChallongeTournament)
	{
		this.getParticipants(tournament).then(() =>
			this.getMatches(tournament).then(() =>
			{
				var batches = tournament.matchGroups;
				if (batches == null)
					throw new Error("Match groups not calculated.")

				var finalParticipants = ExtendedArray.from(batches.filter(g => g.key == null)[0].values)
					.flatten(match => [match.player1_id, match.player2_id])
					.unique()
					.filter(id => id != null);

				var dropoutGroups = ExtendedArray.from(batches.filter(g => g.key != null).map(group =>
				{
					var scores = <AnyDict>{};
					var getScores = (id: number) =>
					{
						var s = scores[id];
						if (s == null)
							s = scores[id] = { wins: 0, losses: 0 };

						return s;
					}
					group.values.forEach(match =>
					{
						if (match.winner_id != "tie" && match.winner_id != null)
							getScores(match.winner_id).wins++;
						if (match.loser_id != null)
							getScores(match.loser_id).losses++;
					});

					type Score = { id: number, score: { wins: number, losses: number } };
					var scoreArray = <Score[]>[];
					for (var key in scores)
						scoreArray.push({ id: parseInt(key), score: scores[key] });

					scoreArray.sort((a, b) =>
						(b.score.wins * 10 - a.score.wins * 10) + (a.score.losses - b.score.losses));

					return scoreArray.map(s => tournament.queryParticipant(s.id).id)
						.filter(id => finalParticipants.some(finalistId => finalistId == id) == false);
				}));

				// Interleave them
				var out = [];
				var totalCount = dropoutGroups.flatten(x => x).length;
				for (var i = 0; i < totalCount; i++)
				{
					var groupIndex = i % dropoutGroups.length;
					var participantIndex = Math.floor(i / dropoutGroups.length);
					out.push(dropoutGroups[groupIndex][participantIndex]);
				}

				this.players.clear();
				out.map(id => tournament.queryParticipant(id).name)
					.filter(name => ChallongeParticipant.byeRegex.test(name) == false)
					.forEach(n => this.players.push(new PlayerViewModel(n)));

				this.notify.showMessage("Players loaded.");
			}));
	}

	disqualifyPlayer(p: ChallongeParticipant)
	{
		var tournament = this.userTournaments.filter(t => t.id == p.tournament_id)[0];
		var matches = tournament.matches.filter(m =>
			m.canEdit && m.winner_id == null &&
			(m.player1 == p || m.player2 == p));

		if (matches.length == 0)
		{
			this.notify.showMessage("Nothing to do.");
			return;
		}

		this.notify.showConfirm("Are you sure?").on((_s, e) =>
		{
			if (e == null) throw new Error();
			if (e.tag != ConfirmButtonType.Yes)
				return;

			var promises: ng.IPromise<ChallongeMatch | null>[] = [];

			matches.forEach(m => 
			{
				var winner = <ChallongeParticipant | undefined>void 0;
				if (m.player1 == p)
				{
					m.scores[0].score1 = -1;
					winner = m.player2;
				}
				else
				{
					m.scores[0].score2 = -1;
					winner = m.player1;
				}

				var promise = this.submitMatch(m, winner);
				if (promise != null)
					promises.push(promise);
			})

			if (promises.length == 0)
				this.notify.showMessage("Nothing to do.");
			else
				Promise.all(promises).then(() => this.notify.showMessage("Done."));
		});
	}

	canStartBracket(t: IChallongeTournament)
	{
		return (t.group_stages_enabled && t.state == 'group_stages_finalized') ||
			(t.group_stages_enabled == false && t.state == 'pending');
	}

	addAdmin(user: IUserViewModel)
	{
		if (this.tournamentAdmins.some(a => a.id == user.id))
			this.notify.showError("User is already an admin.")
		else
			this.tournamentAdmins.push(new UserViewModel(user.id, user.name));
	}

	savePlayers()
	{
		this.playersPropertyOptions.save(this);
	}
	saveAdmins()
	{
		this.tournamentAdminsPropertyOptions.save(this);
	}

	pascalCaseSpacify(str: string)
	{
		return str.replace(/([a-z])([A-Z])/g, "$1 $2")
	}

	clearLocalStorage()
	{
		if (confirm("Just do it?") == false)
			return;

		localStorage.clear();
	}

	matchNotProcessedError()
	{
		return new Error("Match was not preprocessed.");
	}

	wrapApplyAsync(fn: () => any)
	{
		return () => this.$scope.$applyAsync(fn);
	}

	constructor(
		private $injector: ng.auto.IInjectorService,
		private $scope: ng.IScope,
		private $http: ng.IHttpService,
		private dragulaService: any
	)
	{
		var params = currentUrl().searchParams;
		var state = params.has('state') ? JSON.parse(params.get('state')!) : {};
		this.loadState(state);

		if (this.apiEnabled && this.userTournaments.length == 0)
		{
			var promise = this.getTournaments();
			if (promise != null)
				promise.then((ts: ExtendedArray<ChallongeTournament> | null) =>
				{
					// Update tournament selection
					if (ts && ts.some(t => t.id == this.selectedUserTournamentID))
						this.selectedUserTournamentIDChanged();
				});
		}

		var moveCheckTable = (el: HTMLElement, _source: any, handle: HTMLElement) =>
		{
			return handle.classList.contains("drag-handle") && handle.parentElement && handle.parentElement.parentElement == el;
		};

		// Only configure this once.
		this.dragulaService.options($scope, "players", {
			moves: moveCheckTable,
			removeOnSpill: true
		});
		this.dragulaService.options($scope, "group-players", {
			moves: (el: HTMLElement, _source: any, handle: HTMLElement) =>
			{
				return handle.classList.contains("drag-handle") && handle.parentElement && handle.parentElement == el;
			}
		});

		if (this.seenDisclaimer == false)
			this.notify.showMessage(
				"This tool was created primarily to ease the creation of group stages in Challonge. There are no guarantees that this application works as intended, functionality may change at any point and if you enter your API key and shit gets messed up on your account that is your own responsibility.",
				{
					closeButton: false,
					timeout: -1,
					buttons: [
						{
							label: "Got it",
							click: () =>
							{
								this.$scope.$applyAsync(() => this.seenDisclaimer = true);
								return true;
							},
						}
					]
				}
			);
	}
}

interface IApiData
{
	method: "GET" | "POST" | "PUT" | "DELETE",
	endpoint: string;
	api_data: { api_key: string }
}

interface IUrlCheckResult
{
	valid: boolean;
	message: string;
}

function currentUrl()
{
	return new URL(document.location.href);
}

function formatLocalDate()
{
	var now = new Date(),
		tzo = -now.getTimezoneOffset(),
		dif = tzo >= 0 ? '+' : '-',
		pad = (num: number) =>
		{
			var norm = Math.abs(Math.floor(num));
			return (norm < 10 ? '0' : '') + norm;
		};
	return now.getFullYear()
		+ '-' + pad(now.getMonth() + 1)
		+ '-' + pad(now.getDate())
		+ 'T' + pad(now.getHours())
		+ ':' + pad(now.getMinutes())
		+ ':' + pad(now.getSeconds())
		+ dif + pad(tzo / 60)
		+ ':' + pad(tzo % 60);
}

interface ApiData
{
	api_key: string
}