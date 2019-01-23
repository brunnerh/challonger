export function registerDragDrop(app: ng.IModule)
{
	[
		{ directive: "utilDrag", event: "drag" },
		{ directive: "utilDragEnd", event: "dragend" },
		{ directive: "utilDragEnter", event: "dragenter" },
		{ directive: "utilDragExit", event: "dragexit" },
		{ directive: "utilDragLeave", event: "dragleave" },
		{ directive: "utilDragOver", event: "dragover" },
		{ directive: "utilDragStart", event: "dragstart" },
		{ directive: "utilDrop", event: "drop" },
	].forEach(d =>
		app.directive(d.directive, ['$parse', "$rootScope", ($parse, $rootScope: ng.IRootScopeService) =>
			({
				restrict: 'A',
				compile: function (_$element, attr)
				{
					var fn = $parse(attr[d.directive], /* interceptorFn */ null, /* expensiveChecks */ true);
					return function ngEventHandler(scope, element)
					{
						element.on(d.event, event =>
						{
							var callback = () => fn(scope, { $event: event });
							if ($rootScope.$$phase)
							{
								scope.$evalAsync(callback);
							} else
							{
								scope.$apply(callback);
							}
						});
					}
				}
			})])
		);
	
}