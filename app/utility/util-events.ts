import { EventUtility } from "./events-utility";

// ( 'change' event directive does not require ngModel.)
// Adapted from angular source
export function registerEventUtilities(app: ng.IModule)
{
	var directives: [string, string, boolean][] = [
		["utilChange", "change", false],
		["utilScroll", "scroll", true],
		["utilMouseWheel", "mousewheel", false]
	];

	directives.forEach(directiveData =>
	{
		var [directiveName, eventName, throttle] = directiveData;

		app.directive(directiveName, ['$parse', '$rootScope', ($parse: ng.IParseService, $rootScope: ng.IRootScopeService) =>
			({
				restrict: 'A',
				compile: (_$element: any, attr) =>
				{
					// We expose the powerful $event object on the scope that provides access to the Window,
					// etc. that isn't protected by the fast paths in $parse.  We explicitly request better
					// checks at the cost of speed since event handler expressions are not executed as
					// frequently as regular change detection.
					var fn = $parse(attr[directiveName], /* interceptorFn */ void 0, /* expensiveChecks */ true);
					return function ngEventHandler(scope, element: JQLite)
					{
						var processCallback = (callback: () => void) =>
						{
							if ($rootScope.$$phase)
							{
								scope.$evalAsync(callback);
							} else
							{
								scope.$apply(callback);
							}
						};
						if (throttle)
						{
							var target = element[0];
							EventUtility.throttled(target, eventName, e =>
								processCallback(() => fn(scope, { $event: e }))
							);
						}
						else
						{
							element.on(eventName, event =>
								processCallback(() => fn(scope, { $event: event }))
							);
						}
					};
				}
			})]);
	});
}