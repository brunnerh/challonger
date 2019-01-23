import angular from "angular";

/** [util-watch] Watches an object expression and adds the resulting properties to the scope. */
export function registerWatch(app: ng.IModule)
{
	app.directive("utilWatch", () =>
		({
			restrict: 'A',
			link: (scope, _element, attrs) =>
			{
				scope.$watch(attrs["utilWatch"], value =>
					angular.extend(scope, value)
					, true);
			}
		}));
}