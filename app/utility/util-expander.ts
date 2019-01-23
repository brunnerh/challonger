export function registerExpander(app: ng.IModule)
{
	app.directive("utilExpander", [() =>
		(<ng.IDirective>{
			restrict: 'E',
			transclude: {
				"header": "expanderHeader",
				"body": "expanderBody",
			},
			scope: {
				isOpen: "=?",
				isOpenStorageKey: "@?",
				isOpenDefault: "<?"
			},
			controller: UtilExpanderController,
			controllerAs: "ctrl",
			bindToController: true,
			templateUrl: "./app/templates/expander.html",
			link: (_scope, _element, _attr, ctrl: UtilExpanderController) =>
			{
				if (ctrl.isOpen == null)
				{
					ctrl.isOpen = ctrl.isOpenDefault != null ? ctrl.isOpenDefault : true;
				}
			}
		})]);
}


class UtilExpanderController
{
	private static storagePrefix = "expander.";
	isOpenStorageKey: string | undefined;

	private _isOpen: boolean | null = true;
	get isOpen(): boolean | null
	{
		if (this.isOpenStorageKey == null)
			return this._isOpen;

		var storageValue = localStorage.getItem(UtilExpanderController.storagePrefix + this.isOpenStorageKey);
		if (storageValue == null)
			return null;

		return JSON.parse(storageValue);
	}
	set isOpen(value: boolean | null)
	{
		if (this.isOpenStorageKey != null)
			localStorage.setItem(UtilExpanderController.storagePrefix + this.isOpenStorageKey, JSON.stringify(value));
		else
			this._isOpen = value;
	}
	isOpenDefault: boolean | undefined;

	toggle() { this.isOpen = !this.isOpen; }

	constructor()
	{

	}
}