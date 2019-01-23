import { NotificationService } from "./notifications";

export function registerInfoButton(app: ng.IModule)
{
	app.directive("utilInfoButton", [() =>
		(<ng.IDirective>{
			restrict: 'E',
			transclude: true,
			scope: true,
			controller: UtilInfoButtonController,
			controllerAs: "ctrl",
			bindToController: true,
			templateUrl: "./app/templates/info-button.html",
			link: (_scope, _element, _attr, ctrl: UtilInfoButtonController, transclude) =>
			{
				if (transclude == null)
					throw new Error("No transcluded info message.");
	
				transclude(clone =>
				{
					if (clone == null)
						throw new Error("No transcluded element clone.");
	
					var container = document.createElement("div");
					Array.from<Node>(clone).forEach(n => container.appendChild(n));
					ctrl.infoContent = container;
				});
			}
		})]);
}

class UtilInfoButtonController
{
	infoContent!: HTMLElement;

	click()
	{
		NotificationService.instance.showMessage(this.infoContent, {
			modal: true,
			timeout: -1,
			classes: ['info-button-message']
		});
	}
}