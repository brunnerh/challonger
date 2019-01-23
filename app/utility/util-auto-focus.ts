import { BasicEvent } from "./events-utility";

export function registerAutoFocus(app: ng.IModule)
{
	app.directive("utilAutoFocus", ["$timeout", ($timeout: ng.ITimeoutService) =>
	({
		restrict: 'A',
		link: (scope, element: JQLite, attrs) =>
		{
			var focusEvent = <BasicEvent<any, any>>scope.$eval(attrs['utilAutoFocus']);
			var cancel = focusEvent.on(() =>
				$timeout(() => element[0].focus(), 0)
			);
	
			scope.$on("$destroy", () =>
			{
				cancel.cancel();
			});
		}
	})]);
}