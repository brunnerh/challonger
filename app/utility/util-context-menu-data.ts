import angular from "angular";

export function registerContextMenuData(app: ng.IModule)
{
	app.directive("utilContextMenuData", [() =>
		(<ng.IDirective>{
			restrict: 'A',
			link: (scope, _element, attrs) =>
			{
				var data = scope.$eval(attrs["utilContextMenuData"]);
				angular.extend(scope, data);
			}
		})]);
}