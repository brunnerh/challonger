export function registerProxyClick(app: ng.IModule)
{
	app.directive("utilProxyClick", ["$rootScope", "$document", ($rootScope: ng.IRootScopeService, $document: Document[]) =>
		({
			restrict: 'A',
			link: (scope, element: JQLite, attrs) =>
			{
				element[0].addEventListener("click", () =>
				{
					var fn = () =>
					{
						var target = <HTMLElement>$document[0].querySelector(attrs["utilProxyClick"]);
						target.click();
					}
					if ($rootScope.$$phase)
					{
						scope.$evalAsync(fn);
					} else
					{
						scope.$apply(fn);
					}
				});
			}
		})]);
}