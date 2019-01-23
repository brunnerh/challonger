export function registerFocus(app: ng.IModule)
{
	[
		{ directive: "utilFocus", event: "focus" },
		{ directive: "utilBlur", event: "blur" },
	].forEach(d =>
		app.directive(d.directive, ['$parse', "$rootScope", ($parse, $rootScope: ng.IRootScopeService) =>
			({
				restrict: 'A',
				compile: function (_$element, attr)
				{
					var fn = $parse(attr[d.directive], /* interceptorFn */ null, /* expensiveChecks */ true);
					return function ngEventHandler(scope, element)
					{
						element[0].addEventListener(d.event, event =>
						{
							var callback = () => fn(scope, { $event: event });
							if ($rootScope.$$phase)
							{
								scope.$evalAsync(callback);
							} else
							{
								scope.$apply(callback);
							}
						}, true); //Capture
					}
				}
			})])
		);
}
